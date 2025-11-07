// src/app/create-campaign/page.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient, useChainId } from 'wagmi';
import { parseUnits, decodeErrorResult, parseEventLogs } from 'viem';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ROUTER_ADDRESS, DEFAULT_TOKEN_ADDRESS } from '../../blockchain/contracts';
import { poliDaoRouterAbi } from '../../blockchain/routerAbi';
import { useImageUpload } from '@/hooks/useImageUpload';
import './pagestyles.css';

// USDC has 6 decimals
const USDC_DECIMALS = 6;

interface FormData {
  title: string;
  description: string;
  beneficiary: string;
  campaignType: 'target' | 'flexible';
  targetAmount: string;
  duration: string;
  contactInfo: string;
  agreeTerms: boolean;
  agreeDataProcessing: boolean;
  location: string;
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const USDC_TESTNET_ADDRESS: `0x${string}` = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';

function getUsdcAddress(chainId?: number): `0x${string}` | null {
  if (!chainId) return null;
  // 11155111 = Sepolia
  if (chainId === 11155111) return USDC_TESTNET_ADDRESS;
  return null;
}

const USDC_ABI = [
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function"
  },
] as const;

export default function CreateCampaignPage() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Read Router config once – creationEnabledFlag controls creator flow
  const { data: routerConfig } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: poliDaoRouterAbi as any,
    functionName: 'getRouterConfig',
  } as any);

  const publicClient = usePublicClient();
  const chainId = useChainId();

  // creationEnabledFlag is index 4 in getRouterConfig return tuple
  const creationEnabled = Boolean((routerConfig as any)?.[4] ?? true);

  const [createdId, setCreatedId] = useState<bigint | null>(null);
  const [friendlyError, setFriendlyError] = useState<string | null>(null);

  // Creator status
  const [creatorStatus, setCreatorStatus] = useState<'loading' | 'ok' | 'notAllowed' | 'unknown'>('loading');

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    beneficiary: '',
    campaignType: 'target',
    targetAmount: '',
    duration: '30',
    contactInfo: '',
    agreeTerms: false,
    agreeDataProcessing: false,
    location: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  type TokenInfo = { address: `0x${string}`; symbol: string; decimals?: number };
  const [tokensList, setTokensList] = useState<TokenInfo[]>([]);
  const [selectedTokenAddress, setSelectedTokenAddress] = useState<`0x${string}` | null>(null);

  const preCountRef = useRef<bigint | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { uploadImage, isUploading, error: uploadError } = useImageUpload();

  // Image preview effect
  useEffect(() => {
    if (!imageFile) {
      setImagePreview('');
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error once user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (formData.title.length < 10) newErrors.title = 'Title must be at least 10 characters';
      if (formData.title.length > 100) newErrors.title = 'Title cannot exceed 100 characters';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (formData.description.length < 50) newErrors.description = 'Description must be at least 50 characters';
      // Decrease limit to 1000 characters (safe contract limit)
      if (formData.description.length > 1000) newErrors.description = 'Description cannot exceed 1000 characters (contract limit)';
      if (!formData.beneficiary.trim()) newErrors.beneficiary = 'Select who is the beneficiary';
      if (formData.location.length > 50) newErrors.location = 'Location max 50 characters';
      
      // Enhanced image validation
      if (imageFile) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (imageFile.size > maxSize) {
          newErrors.image = 'Image must be no larger than 5MB';
        }
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(imageFile.type)) {
          newErrors.image = 'Allowed formats: JPG, PNG, WebP';
        }
      }
    }

    if (step === 2) {
      if (formData.campaignType === 'target') {
        if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
          newErrors.targetAmount = 'Goal amount must be greater than 0';
        }
        if (parseFloat(formData.targetAmount) > 1000000) {
          newErrors.targetAmount = 'Goal amount cannot exceed 1,000,000 USDC';
        }
      }
      if (!formData.duration || parseInt(formData.duration) < 1 || parseInt(formData.duration) > 365) {
        newErrors.duration = 'Duration must be between 1 and 365 days';
      }
    }

    if (step === 3) {
      if (!formData.agreeTerms) newErrors.agreeTerms = 'You must accept the Terms of Service';
      if (!formData.agreeDataProcessing) newErrors.agreeDataProcessing = 'You must consent to data processing';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const mapError = (raw: string): string => {
    const lower = raw.toLowerCase();
    if (lower.includes('invalidenddate')) return 'Invalid end date';
    if (lower.includes('goalamountrequired')) return 'You must provide a goal amount for this fundraiser type';
    if (lower.includes('goalamounttoolarge')) return 'Goal amount is too high';
    if (lower.includes('titletoolong')) return 'Title is too long';
    if (lower.includes('descriptiontoolong')) return 'Description is too long';
    if (lower.includes('invalidtitle')) return 'Title does not meet requirements';
    if (lower.includes('invalidamount')) return 'Invalid amount';
    if (lower.includes('tokennotwhitelisted')) return 'Selected token is not whitelisted';
    // Map known error signature
    if (lower.includes('0xd7cfc590')) return 'Fundraiser description is too long - maximum 1000 characters';
    if (lower.includes('invalid creator')) return 'Your account is not authorized to create fundraisers (Invalid creator). Contact support or complete verification.';
    return 'Transaction failed — check the data or try again';
  };

  const mapFundraiserType = (campaignType: 'target' | 'flexible'): number => (campaignType === 'target' ? 0 : 1);

  const extractCidFromResponse = (x: any): string => {
    if (!x) return '';
    if (typeof x === 'string') return x;
    if (typeof x.cid === 'string') return x.cid;
    if (x.cid && typeof x.cid['/'] === 'string') return x.cid['/'];
    if (typeof x.Hash === 'string') return x.Hash;
    if (typeof x.Cid === 'string') return x.Cid;
    return '';
  };

  const handleSubmit = async () => {
    if (creatorStatus === 'notAllowed') {
      setFriendlyError('Your account is not authorized to create fundraisers.');
      return;
    }
    if (!validateStep(3) || !isConnected) return;

    setFriendlyError(null);
    setCreatedId(null);
    preCountRef.current = null;

    const networkUsdc = getUsdcAddress(chainId) as `0x${string}` | null;
    const effectiveToken =
      (networkUsdc as `0x${string}`) ||
      (selectedTokenAddress as `0x${string}`) ||
      (DEFAULT_TOKEN_ADDRESS as unknown as `0x${string}`);

    if (!effectiveToken || effectiveToken.toLowerCase() === ZERO_ADDRESS) {
      setFriendlyError('Missing valid token address. Please contact support.');
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const endDate = BigInt(now + parseInt(formData.duration) * 24 * 60 * 60);

    try {
      // No IPFS metadata - use empty string
      const metadataHash = '';

      const selectedAddr = (selectedTokenAddress || networkUsdc) as `0x${string}` | null;
      const selected = tokensList.find(t => t.address.toLowerCase() === (selectedAddr || '').toLowerCase());
      const decimalsUsed = selected?.decimals ?? 6;
      const goalAmount = formData.campaignType === 'target' ? parseUnits(formData.targetAmount || '0', decimalsUsed) : 0n;
      const fundraiserType = mapFundraiserType(formData.campaignType);
      const images: string[] = []; // No blockchain images
      const videos: string[] = [];
      const location = formData.location || '';

      if (process.env.NODE_ENV !== 'production') {
        console.debug('createFundraiser payload', {
          title: formData.title.trim(),
          description: formData.description.trim(),
          location,
          hasImage: !!imageFile
        });
      }

      // Pre-check token whitelist
      try {
        if (publicClient) {
          const whitelisted = await publicClient.readContract({
            address: ROUTER_ADDRESS,
            abi: poliDaoRouterAbi as any,
            functionName: 'isTokenWhitelisted',
            args: [effectiveToken]
          });
          if (whitelisted === false) {
            setFriendlyError('Selected token is not allowed (not on the whitelist).');
            return;
          }
        }
      } catch {
        // ignore if function not available
      }

      // Pre-simulation
      try {
        if (publicClient) {
          await publicClient.simulateContract({
            address: ROUTER_ADDRESS,
            abi: poliDaoRouterAbi as any,
            functionName: 'createFundraiser',
            account: address as `0x${string}`,
            args: [{
              title: formData.title.trim(),
              description: formData.description.trim(),
              endDate,
              fundraiserType,
              token: effectiveToken,
              goalAmount,
              initialImages: images,
              initialVideos: videos,
              metadataHash,
              location,
              isFlexible: formData.campaignType === 'flexible'
            }]
          });
          if (process.env.NODE_ENV !== 'production') {
            console.debug('simulateContract OK', { initialImages: images });
          }
        }
      } catch (simErr: any) {
        console.error('Simulation revert', simErr);
        try {
          if (simErr?.data) {
            const decoded = decodeErrorResult({ abi: poliDaoRouterAbi as any, data: simErr.data });
            setFriendlyError(mapError(decoded.errorName || simErr?.shortMessage || simErr?.message || 'Błąd symulacji'));
          } else {
            setFriendlyError(mapError(simErr?.shortMessage || simErr?.message || 'Błąd symulacji'));
          }
        } catch {
          setFriendlyError(mapError(simErr?.shortMessage || simErr?.message || 'Błąd symulacji'));
        }
        return;
      }

      // Send transaction
      await writeContract({
        address: ROUTER_ADDRESS,
        abi: poliDaoRouterAbi as any,
        functionName: 'createFundraiser',
        args: [{
          title: formData.title.trim(),
          description: formData.description.trim(),
          endDate,
          fundraiserType,
          token: effectiveToken,
          goalAmount,
          initialImages: images,
          initialVideos: videos,
          metadataHash,
          location,
          isFlexible: formData.campaignType === 'flexible'
        }]
      });

    } catch (error: any) {
      console.error('❌ Error creating fundraiser:', error);
      setFriendlyError(mapError(error?.message || ''));
    }
  };

  // After success – parse FundraiserCreated event and store metadata with image
  useEffect(() => {
    const run = async () => {
      if (!isSuccess || createdId || !publicClient || !hash) return;
      
      let campaignId: bigint | null = null;
      
      try {
        const receipt = await publicClient.getTransactionReceipt({ hash });
        const events = parseEventLogs({
          abi: poliDaoRouterAbi as any,
          logs: receipt.logs,
          eventName: 'FundraiserCreated'
        });
        const first = events?.[0];
        const evtId = (first?.args as any)?.fundraiserId as bigint | undefined;
        if (evtId != null) {
          campaignId = evtId;
          setCreatedId(evtId);
        }
      } catch {
        // proceed to fallback below
      }

      // Fallback method if event parsing fails
      if (!campaignId) {
        try {
          const pre = preCountRef.current ?? null;
          let attempts = 0;
          while (attempts < 20) {
            const total: any = await publicClient.readContract({
              address: ROUTER_ADDRESS,
              abi: poliDaoRouterAbi as any,
              functionName: 'getFundraiserCount',
            });
            if (typeof total === 'bigint') {
              if (pre == null) {
                if (total > 0n) {
                  campaignId = total - 1n;
                  setCreatedId(total - 1n);
                  break;
                }
              } else if (total > pre) {
                campaignId = total - 1n;
                setCreatedId(total - 1n);
                break;
              }
            }
            await new Promise((r) => setTimeout(r, 800));
            attempts++;
          }
        } catch {
          // ignore
        }
      }

      // Store campaign metadata in database after successful blockchain transaction
      if (campaignId != null && address) {
        try {
          let imageUrl = '';
          
          // Upload image if available
          if (imageFile) {
            console.log('📤 Uploading image for fundraiser:', campaignId.toString());
            
            // Create FormData for proper file upload
            const formData = new FormData();
            formData.append('file', imageFile);
            
            try {
              const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              });
              
              if (uploadResponse.ok) {
                const uploadResult = await uploadResponse.json();
                imageUrl = uploadResult.url || uploadResult.imageUrl || '';
                console.log('✅ Image uploaded successfully:', imageUrl);
              } else {
                const errorText = await uploadResponse.text();
                console.error('❌ Upload failed:', errorText);
                setFriendlyError(`Image upload failed: ${errorText}`);
              }
            } catch (uploadError) {
              console.error('❌ Upload error:', uploadError);
              setFriendlyError(`Image upload failed: ${uploadError}`);
            }
          }

          // Use the same ID as in URL (campaignId + 1)
          const displayId = (campaignId + 1n).toString();
          console.log('💾 Saving to database with displayId:', displayId, 'for redirect URL');

          // Store campaign metadata
          const metadataResponse = await fetch('/api/campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaignId: displayId,
              title: formData.title.trim(),
              description: formData.description.trim(),
              imageUrl: imageUrl || undefined,
              location: formData.location || undefined,
              creator: address.toLowerCase()
            }),
          });

          if (!metadataResponse.ok) {
            console.warn('Failed to store campaign metadata:', await metadataResponse.text());
          } else {
            console.log('✅ Campaign metadata stored successfully with ID:', displayId);
          }
        } catch (metaError) {
          console.error('❌ Error storing campaign metadata:', metaError);
        }
      }
    };
    run();
  }, [isSuccess, createdId, publicClient, hash, address, imageFile, formData]);

  // Auto-redirect after createdId is available
  useEffect(() => {
    if (createdId) {
      const displayId = (createdId + 1n).toString();
      console.log('🔄 Redirecting to fundraiser:', displayId);
      const t = setTimeout(() => {
        window.location.href = `/campaigns/${displayId}`;
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [createdId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!address || !publicClient) {
        setCreatorStatus('unknown');
        return;
      }
      setCreatorStatus('loading');
      const candidateFns = [
        'isCreatorWhitelisted',
        'isFundraiserCreator',
        'isUserWhitelisted',
        'creatorWhitelist',
        'approvedCreators'
      ];
      for (const fn of candidateFns) {
        try {
          const res: any = await publicClient.readContract({
            address: ROUTER_ADDRESS,
            abi: poliDaoRouterAbi as any,
            functionName: fn as any,
            args: [address]
          });
          if (cancelled) return;
            if (typeof res === 'boolean') {
              setCreatorStatus(res ? 'ok' : 'notAllowed');
              return;
            }
        } catch {
          // ignorujemy jeśli funkcji nie ma / revert
        }
      }
      // jeśli żadna funkcja nie pasowała – pozostawiamy unknown (nie blokujemy)
      if (!cancelled) setCreatorStatus('unknown');
    })();
    return () => { cancelled = true; };
  }, [address, publicClient]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!publicClient) return;

      const list: TokenInfo[] = [];
      const seen = new Set<string>();

      const pushToken = async (addr: `0x${string}`) => {
        const low = addr.toLowerCase();
        if (seen.has(low) || low === ZERO_ADDRESS.toLowerCase()) return;
        seen.add(low);
        let symbol = 'TOKEN';
        let decimals: number | undefined = undefined;
        try {
          const s = await publicClient.readContract({
            address: addr,
            abi: USDC_ABI as any,
            functionName: 'symbol',
          });
          if (typeof s === 'string' && s.length) symbol = s;
        } catch {}
        try {
          const d = await publicClient.readContract({
            address: addr,
            abi: USDC_ABI as any,
            functionName: 'decimals',
          }) as number | bigint;
          decimals = typeof d === 'bigint' ? Number(d) : Number(d);
        } catch {}
        list.push({ address: addr, symbol, decimals });
      };

      // Router whitelist
      try {
        const whitelisted = await publicClient.readContract({
          address: ROUTER_ADDRESS,
          abi: poliDaoRouterAbi as any,
          functionName: 'getWhitelistedTokens',
        }) as `0x${string}`[] | undefined;
        if (Array.isArray(whitelisted)) {
          for (const addr of whitelisted) {
            await pushToken(addr as `0x${string}`);
          }
        }
      } catch {
        // ignore if not available
      }

      // Network USDC
      const netUsdc = getUsdcAddress(chainId);
      if (netUsdc) {
        await pushToken(netUsdc as `0x${string}`);
      }

      // DEFAULT_TOKEN_ADDRESS
      if (DEFAULT_TOKEN_ADDRESS) {
        await pushToken(DEFAULT_TOKEN_ADDRESS as unknown as `0x${string}`);
      }

      if (cancelled) return;
      setTokensList(list);
      if (!selectedTokenAddress && list.length > 0) {
        setSelectedTokenAddress(list[0].address);
      }
    })();
    return () => { cancelled = true; };
  }, [publicClient, chainId, DEFAULT_TOKEN_ADDRESS, selectedTokenAddress]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero section */}
      <div className="bg-[#10b981] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Create a fundraiser and collect in USDC
          </h1>
          <p className="text-xl text-green-100 max-w-3xl mx-auto">
            By launching a fundraiser on our blockchain platform, you receive stable USDC with full transparency and security.
          </p>
          <div className="mt-6 inline-flex items-center bg-white/20 rounded-full px-6 py-3">
            <span className="text-2xl mr-3">💲</span>
            <span className="font-semibold">USDC only — a stable cryptocurrency</span>
          </div>
        </div>
      </div>

      {/* Main form */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step <= currentStep 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 md:w-32 h-1 mx-2 ${
                      step < currentStep ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Fundraiser details</span>
              <span>Settings</span>
              <span>Summary</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            
            {/* Step 1: Fundraiser details */}
            {currentStep === 1 && (
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  📝 Describe your fundraiser
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fundraiser title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Provide a short, descriptive title for your fundraiser"
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] transition-all text-lg font-medium ${
                        errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      style={{ fontSize: '18px' }}
                    />
                    {errors.title && (
                      <p className="mt-2 text-sm text-red-600 font-medium">{errors.title}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      {formData.title.length}/100 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Who is the beneficiary? *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
                        <input
                          type="radio"
                          name="beneficiary"
                          value="myself"
                          checked={formData.beneficiary === 'myself'}
                          onChange={(e) => handleInputChange('beneficiary', e.target.value)}
                          className="mr-3 text-green-600 w-5 h-5"
                        />
                        <span className="font-semibold text-lg">Individual</span>
                      </label>
                      <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
                        <input
                          type="radio"
                          name="beneficiary"
                          value="other"
                          checked={formData.beneficiary === 'other'}
                          onChange={(e) => handleInputChange('beneficiary', e.target.value)}
                          className="mr-3 text-green-600 w-5 h-5"
                        />
                        <span className="font-semibold text-lg">Foundation / Initiative</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Location (city / country) (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="e.g. Warsaw, Poland"
                        className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] transition-all text-lg font-medium ${
                          errors.location ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {errors.location && (
                        <p className="mt-2 text-sm text-red-600 font-medium">{errors.location}</p>
                      )}
                      <p className="mt-1 text-sm text-gray-500">
                        {formData.location.length}/50 characters
                      </p>
                    </div>
                    {errors.beneficiary && (
                      <p className="mt-2 text-sm text-red-600 font-medium">{errors.beneficiary}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Describe the situation and provide context *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={6}
                      placeholder="Explain the situation, how the funds will be used, and why you need help..."
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] transition-all resize-none font-medium ${
                        errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      style={{ fontSize: '16px', lineHeight: '1.5' }}
                    />
                    {errors.description && (
                      <p className="mt-2 text-sm text-red-600 font-medium">{errors.description}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      {formData.description.length}/1000 characters (minimum 50)
                    </p>
                    {formData.description.length > 900 && (
                      <p className="mt-1 text-sm text-amber-600 font-medium">
                        ⚠️ You are approaching the character limit! Remaining: {1000 - formData.description.length}
                      </p>
                    )}
                  </div>

                  {/* Enhanced image upload section */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fundraiser image (optional)
                    </label>
                    <div className="space-y-4">
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                            </svg>
                            <p className="mb-2 text-sm text-gray-500 font-medium">
                              <span className="font-semibold">Click to add</span> or drag & drop an image
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG, WebP (max 5MB)</p>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              setImageFile(file || null);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      
                      {uploadError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-600 font-medium">❌ {uploadError}</p>
                        </div>
                      )}
                      
                      {errors.image && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-600 font-medium">❌ {errors.image}</p>
                        </div>
                      )}
                      
                      {imagePreview && (
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="Fundraiser image preview" 
                            className="w-full max-w-md mx-auto h-48 object-cover rounded-xl border-2 border-gray-200 shadow-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview('');
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm transition-colors"
                          >
                            ✕
                          </button>
                          <div className="mt-2 text-center">
                            <p className="text-sm text-gray-600 font-medium">
                              {imageFile?.name} • {imageFile && (imageFile.size / 1024 / 1024).toFixed(1)}MB
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div
                        className="rounded-lg p-4"
                        style={{
                          background: "rgba(26, 35, 50, 0.98)",
                          border: "1.5px solid #10b981",
                          color: "#e0ffe0",
                          boxShadow: "0 2px 12px 0 rgba(16,185,129,0.15)"
                        }}
                      >
                        <h4 style={{ color: "#10b981", fontWeight: "bold", marginBottom: "8px", fontSize: "1.08rem" }}>
                          💡 Image tips:
                        </h4>
                        <ul style={{ color: "#e0ffe0", fontSize: "15px", margin: 0, paddingLeft: "18px", fontWeight: 500 }}>
                          <li>• Add an image that shows the situation or problem</li>
                          <li>• Avoid images with personal data (documents, IDs)</li>
                          <li>• Clear, high-quality images attract more donors</li>
                          <li>• The image should be related to the fundraiser’s goal</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Financial settings */}
            {currentStep === 2 && (
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  💰 Financial settings
                </h2>

                {/* USDC info */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-4">💲</span>
                    <div>
                      <h3 className="text-lg font-bold text-blue-900">USDC — Stable cryptocurrency</h3>
                      <p className="text-blue-700">Your fundraiser will collect funds in USDC (1 USDC ≈ 1 USD)</p>
                    </div>
                  </div>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>✅ Stable value — does not fluctuate like Bitcoin or Ethereum</p>
                    <p>✅ Easy to exchange to local currency via crypto exchanges</p>
                    <p>✅ Transparent transactions on the blockchain</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Token selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Donation token
                    </label>
                    <select
                      value={selectedTokenAddress ?? ''}
                      onChange={(e) => setSelectedTokenAddress(e.target.value as `0x${string}`)}
                      className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] font-medium text-lg"
                    >
                      {tokensList.map(t => (
                        <option key={t.address} value={t.address}>
                          {t.symbol}{t.decimals != null ? ` (${t.decimals})` : ''} — {t.address.slice(0,6)}...{t.address.slice(-4)}
                        </option>
                      ))}
                    </select>
                    {(!tokensList || tokensList.length === 0) && (
                      <p className="mt-2 text-sm text-amber-600">
                        No tokens detected — the network default will be used.
                      </p>
                    )}
                  </div>

                  {/* Fundraiser type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      Fundraiser type
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.campaignType === 'target' 
                          ? 'border-[#10b981] bg-[#10b981]/10' 
                          : 'border-gray-200 hover:border-[#10b981]'
                      }`}>
                        <input
                          type="radio"
                          name="campaignType"
                          value="target"
                          checked={formData.campaignType === 'target'}
                          onChange={(e) => handleInputChange('campaignType', e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center mb-3">
                          <span className="text-2xl mr-3">🎯</span>
                          <span className="font-bold text-lg">Goal-based fundraiser</span>
                        </div>
                        <p className="text-sm text-gray-600 font-medium">
                          You set a specific amount in USDC. If the goal is not reached, funds are returned to donors.
                        </p>
                        <div className="mt-3 text-xs text-green-600 font-bold">
                          ✓ All-or-nothing
                        </div>
                      </label>

                      <label className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.campaignType === 'flexible' 
                          ? 'border-[#10b981] bg-[#10b981]/10' 
                          : 'border-gray-200 hover:border-[#10b981]'
                      }`}>
                        <input
                          type="radio"
                          name="campaignType"
                          value="flexible"
                          checked={formData.campaignType === 'flexible'}
                          onChange={(e) => handleInputChange('campaignType', e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center mb-3">
                          <span className="text-2xl mr-3">🌊</span>
                          <span className="font-bold text-lg">Flexible fundraiser</span>
                        </div>
                        <p className="text-sm text-gray-600 font-medium">
                          Raise funds without a specific goal. All USDC donations remain with you.
                        </p>
                        <div className="mt-3 text-xs text-green-600 font-bold">
                          ✓ Every amount helps
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Goal amount - only for goal-based fundraiser */}
                  {formData.campaignType === 'target' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Enter fundraiser goal in USDC *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          max="1000000"
                          value={formData.targetAmount}
                          onChange={(e) => handleInputChange('targetAmount', e.target.value)}
                          placeholder="1000.00"
                          className={`w-full px-6 py-5 pr-20 border-2 rounded-xl focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] font-bold text-2xl ${
                            errors.targetAmount ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        <div className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-600 font-bold text-xl">
                          USDC
                        </div>
                      </div>
                      {errors.targetAmount && (
                        <p className="mt-2 text-sm text-red-600 font-medium">{errors.targetAmount}</p>
                      )}
                      <p className="mt-2 text-sm text-[#10b981] font-medium">
                        💡 1 USDC ≈ 1 USD ≈ 4 PLN | Consider a realistic goal
                      </p>
                    </div>
                  )}

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fundraiser duration (days) *
                    </label>
                    <select
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] font-bold text-lg ${
                        errors.duration ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                      <option value="30">30 days (recommended)</option>
                      <option value="60">60 days</option>
                      <option value="90">90 days</option>
                      <option value="180">180 days</option>
                      <option value="365">365 days</option>
                    </select>
                    {errors.duration && (
                      <p className="mt-2 text-sm text-red-600 font-medium">{errors.duration}</p>
                    )}
                  </div>

                  {/* Contact info */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contact information (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.contactInfo}
                      onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                      placeholder="Email or phone number"
                      className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] font-medium text-lg"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Donors may contact you regarding the fundraiser
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Summary and consents */}
            {currentStep === 3 && (
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  📋 Summary and publish
                </h2>

                {/* Summary */}
                <div className="summary-section">
                  <h3>Fundraiser summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="label">Title:</span>
                      <span className="value">{formData.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="label">Type:</span>
                      <span className="value">{formData.campaignType === 'target' ? '🎯 Goal-based fundraiser' : '🌊 Flexible fundraiser'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="label">Currency:</span>
                      <span className="value blue">💲 USDC (stablecoin)</span>
                    </div>
                    {formData.campaignType === 'target' && (
                      <div className="flex justify-between">
                        <span className="label">Goal amount:</span>
                        <span className="value green">{formData.targetAmount} USDC</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="label">Duration:</span>
                      <span className="value">{formData.duration} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="label">Beneficiary:</span>
                      <span className="value">{formData.beneficiary === 'myself' ? 'Individual' : 'Foundation / Initiative'}</span>
                    </div>
                    {formData.location && (
                      <div className="flex justify-between">
                        <span className="label">Location:</span>
                        <span className="value">{formData.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="info-section">
                  <h4>ℹ️ Important information</h4>
                  <ul>
                    <li>• All transactions are recorded on the blockchain and are publicly visible</li>
                    <li>• Platform fee is 2.5% of the collected amount</li>
                    <li>• After creating, you cannot edit basic fundraiser parameters</li>
                    <li>• The fundraiser accepts USDC only — a stable cryptocurrency</li>
                    <li>• The fundraiser ends automatically after the specified duration</li>
                  </ul>
                </div>

                {/* Consents */}
                <div className="mt-6 space-y-3">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={formData.agreeTerms}
                      onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
                      className="mt-1 w-5 h-5 text-green-600"
                    />
                    <span className="text-sm text-gray-800">
                      I accept the <a href="/terms" target="_blank" className="text-green-600 underline">Terms of Service</a>.
                    </span>
                  </label>
                  {errors.agreeTerms && (
                    <p className="text-sm text-red-600 font-medium">{errors.agreeTerms}</p>
                  )}
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={formData.agreeDataProcessing}
                      onChange={(e) => handleInputChange('agreeDataProcessing', e.target.checked)}
                      className="mt-1 w-5 h-5 text-green-600"
                    />
                    <span className="text-sm text-gray-800">
                      I consent to the processing of my personal data in accordance with the <a href="/privacy" target="_blank" className="text-green-600 underline">Privacy Policy</a>.
                    </span>
                  </label>
                  {errors.agreeDataProcessing && (
                    <p className="text-sm text-red-600 font-medium">{errors.agreeDataProcessing}</p>
                  )}
                </div>

                {/* Publish button */}
                <div className="mt-8">
                  <button
                    onClick={handleSubmit}
                    disabled={
                      !creationEnabled ||
                      isPending ||
                      isConfirming ||
                      !formData.agreeTerms ||
                      !formData.agreeDataProcessing ||
                      creatorStatus === 'notAllowed' ||
                      creatorStatus === 'loading'
                    }
                    className="w-full bg-[#10b981] hover:bg-[#10b981] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-5 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 text-xl shadow-lg hover:shadow-[0_0_25px_rgba(16,185,129,0.45)]"
                  >
                    {!creationEnabled
                      ? 'Creation disabled'
                      : (isPending || isConfirming)
                        ? (
                          <div className="flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                            {isPending ? '1/2 Sending...' : '2/2 Confirming...'}
                          </div>
                        )
                        : (
                          <div className="flex items-center justify-center">
                            <span className="mr-3">🚀</span>
                            Publish fundraiser in USDC
                          </div>
                        )}
                  </button>
                  {creatorStatus === 'notAllowed' && (
                    <p className="mt-2 text-sm text-red-600 font-medium">
                      Your account is not authorized to create fundraisers. Complete verification or contact support.
                    </p>
                  )}
                  {creatorStatus === 'loading' && (
                    <p className="mt-2 text-sm text-gray-600 font-medium">
                      Checking creator permissions...
                    </p>
                  )}
                  {creatorStatus === 'unknown' && (
                    <p className="mt-2 text-xs text-gray-500 font-medium">
                      Unable to confirm creator permissions. Creation may fail if the contract requires verification.
                    </p>
                  )}
                  {(friendlyError || error) && (
                    <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                      <p className="text-red-700 text-sm font-medium">
                        <strong>Error:</strong> {friendlyError || error?.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation */}
            {currentStep < 3 && (
              <div className="px-8 py-4 bg-gray-50 border-t-2 border-gray-200 flex justify-between">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
                >
                  ← Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-[#10b981] hover:bg-[#10b981] text-white font-bold rounded-lg transition-all duration-300 text-lg transform hover:scale-105 shadow-md hover:shadow-[0_0_20px_rgba(16,185,129,0.45)]"
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          {/* Additional information */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">💲</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">USDC — Stability</h3>
              <p className="text-gray-600 text-sm font-medium">
                Raise funds in a stable currency (USDC) that does not fluctuate like Bitcoin or Ethereum.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Security</h3>
              <p className="text-gray-600 text-sm font-medium">
                All transactions are secured by the blockchain and smart contracts.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Transparency</h3>
              <p className="text-gray-600 text-sm font-medium">
                Every donation is publicly visible. Donors know exactly where their money goes.
              </p>
            </div>
          </div>

          {/* FAQ for USDC */}
          <div className="mt-12 bg-white rounded-xl p-8 shadow-lg border-2 border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">❓ Frequently asked questions about USDC</h3>
            <div className="space-y-4">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="font-bold text-gray-900">What is USDC?</span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 p-4 text-gray-600 text-sm leading-relaxed font-medium">
                  USDC (USD Coin) is a stable cryptocurrency pegged to ~1 US dollar. 
                  It’s a safe alternative to volatile cryptocurrencies like Bitcoin or Ethereum.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="font-bold text-gray-900">How can I convert USDC to my local currency?</span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 p-4 text-gray-600 text-sm leading-relaxed font-medium">
                  You can easily convert USDC through reputable cryptocurrency exchanges operating in your region.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="font-bold text-gray-900">Why not ETH or Bitcoin?</span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 p-4 text-gray-600 text-sm leading-relaxed font-medium">
                  ETH and Bitcoin can fluctuate significantly. USDC is stable — if you raise 1000 USDC, 
                  it remains roughly 1000 USD regardless of market volatility.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="font-bold text-gray-900">Is USDC safe?</span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 p-4 text-gray-600 text-sm leading-relaxed font-medium">
                  Yes. USDC is issued by regulated companies and backed by USD reserves. 
                  It’s one of the safest cryptocurrencies on the market.
                </div>
              </details>
            </div>
          </div>

          {/* Support */}
          <div className="support-section">
            <h3>Need help with USDC?</h3>
            <p>
              Our team can assist you at every step and explain how USDC works.
            </p>
            <div style={{ display: "flex", flexDirection: "row", gap: "18px", justifyContent: "center" }}>
              <a href="/contact" className="contact-link">📧 Contact us</a>
              <a href="/white-paper" className="doc-link">📖 Read the documentation</a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
