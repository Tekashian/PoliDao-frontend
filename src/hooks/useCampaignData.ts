import { useState, useEffect } from 'react';
import { Interface, JsonRpcProvider } from 'ethers';
import { formatUnits } from 'viem';
import { poliDaoCoreAbi } from '../blockchain/coreAbi';
import { poliDaoRouterAbi } from '../blockchain/routerAbi';
import { poliDaoStorageAbi } from '../blockchain/storageAbi';
import { ROUTER_ADDRESS } from '../blockchain/contracts';

interface DonationLog {
  donor: string;
  amount: number;
  timestamp: number;
  txHash: string;
}

interface Update {
  content: string;
  timestamp: number;
}

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

export function useDonationLogs(campaignId: number, decimals: number, coreAddress?: string) {
  const [donations, setDonations] = useState<DonationLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (campaignId < 0) return;

    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
    if (!rpcUrl) return;

    let disposed = false;
    setLoading(true);

    const fetchDonationLogs = async () => {
      try {
        const provider = new JsonRpcProvider(rpcUrl);
        const fundraiserTopic = '0x' + BigInt(campaignId).toString(16).padStart(64, '0');

        const parseLogs = async (logs: any[], iface: Interface) => {
          const items = await Promise.all(
            logs.map(async (log) => {
              try {
                const decoded = iface.parseLog(log as any);
                const args = decoded.args as any;
                const fundraiserId = (args?.fundraiserId ?? args?.id ?? args?.[0] ?? null) as bigint | null;
                if (fundraiserId === null || Number(fundraiserId) !== Number(campaignId)) return null;

                const donor = (args?.donor ?? args?.[1] ?? ZERO_ADDR) as string;
                const amountRaw = (args?.amount ?? args?.[3] ?? 0n) as bigint;
                const block = await provider.getBlock(log.blockHash!);
                const tsMs = block?.timestamp ? Number(block.timestamp) * 1000 : Date.now();

                return {
                  donor: donor?.toLowerCase?.() || ZERO_ADDR,
                  amount: Number(formatUnits(amountRaw, decimals)),
                  timestamp: tsMs,
                  txHash: log.transactionHash || '',
                } as DonationLog;
              } catch {
                return null;
              }
            })
          );
          return items.filter((x): x is DonationLog => !!x).sort((a, b) => b.timestamp - a.timestamp);
        };

        let items: DonationLog[] = [];
        
        // Try Core logs first
        if (coreAddress) {
          const coreIface = new Interface(poliDaoCoreAbi as any);
          const coreEv = (coreIface as any).getEvent?.('DonationMade') ?? (coreIface.fragments.find((f: any) => f.type === 'event' && f.name === 'DonationMade'));
          const coreTopic = (coreIface as any).getEventTopic ? (coreIface as any).getEventTopic(coreEv) : (coreIface as any).getEventTopic?.('DonationMade');

          const logsCore = await provider.getLogs({
            address: coreAddress as string,
            fromBlock: process.env.NEXT_PUBLIC_CORE_START_BLOCK ? BigInt(process.env.NEXT_PUBLIC_CORE_START_BLOCK) : 0n,
            toBlock: 'latest',
            topics: [coreTopic, fundraiserTopic],
          });

          if (logsCore.length > 0) {
            items = await parseLogs(logsCore, coreIface);
          }
        }

        // Fallback to Router logs
        if (!items.length) {
          const routerIface = new Interface(poliDaoRouterAbi as any);
          const routerEv = (routerIface as any).getEvent?.('DonationMade') ?? (routerIface.fragments.find((f: any) => f.type === 'event' && f.name === 'DonationMade'));
          const routerTopic = (routerIface as any).getEventTopic ? (routerIface as any).getEventTopic(routerEv) : (routerIface as any).getEventTopic?.('DonationMade');

          const logsRouter = await provider.getLogs({
            address: ROUTER_ADDRESS as string,
            fromBlock: process.env.NEXT_PUBLIC_ROUTER_START_BLOCK ? BigInt(process.env.NEXT_PUBLIC_ROUTER_START_BLOCK) : 0n,
            toBlock: 'latest',
            topics: [routerTopic, fundraiserTopic],
          });

          if (logsRouter.length > 0) {
            items = await parseLogs(logsRouter, routerIface);
          }
        }

        if (!disposed) {
          setDonations(items);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Error fetching donation logs:', err);
        if (!disposed) {
          setDonations([]);
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchDonationLogs, 500);
    const interval = setInterval(fetchDonationLogs, 20000);
    
    return () => {
      disposed = true;
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [campaignId, decimals, coreAddress]);

  return { donations, loading };
}

export function useUpdates(campaignId: number, updatesAddress?: string, storageAddress?: string) {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (campaignId < 0) return;

    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
    if (!rpcUrl) return;

    let disposed = false;
    setLoading(true);

    const fetchUpdates = async () => {
      try {
        const provider = new JsonRpcProvider(rpcUrl);
        let entriesFromUpdates: Update[] = [];

        // Try Updates module first
        if (updatesAddress) {
          const uiface = new Interface([
            'event UpdatePosted(uint256 indexed updateId, uint256 indexed fundraiserId, address indexed author, string content, uint8 updateType)'
          ] as any);
          const ev = (uiface as any).getEvent?.('UpdatePosted') ?? (uiface.fragments.find((f: any) => f.type === 'event' && f.name === 'UpdatePosted'));
          
          if (ev) {
            const topic0 = (uiface as any).getEventTopic ? (uiface as any).getEventTopic(ev) : (uiface as any).getEventTopic?.('UpdatePosted');

            const logs = await provider.getLogs({
              address: updatesAddress as string,
              fromBlock: process.env.NEXT_PUBLIC_UPDATES_START_BLOCK ? BigInt(process.env.NEXT_PUBLIC_UPDATES_START_BLOCK) : 0n,
              toBlock: 'latest',
              topics: [topic0],
            });

            const parsed = await Promise.all(
              logs.map(async (log) => {
                try {
                  const decoded = uiface.parseLog(log as any);
                  const args = decoded.args as any;
                  const fid = Number(args?.fundraiserId ?? args?.[1] ?? -1);
                  if (fid !== Number(campaignId)) return null;
                  const block = await provider.getBlock(log.blockHash!);
                  const tsMs = block?.timestamp ? Number(block.timestamp) * 1000 : Date.now();
                  const content = String(args?.content ?? '');
                  return { content, timestamp: tsMs } as Update;
                } catch {
                  return null;
                }
              })
            );
            entriesFromUpdates = parsed.filter((x): x is Update => !!x).sort((a, b) => b.timestamp - a.timestamp);
          }
        }

        // Fallback to Storage events
        if (entriesFromUpdates.length === 0 && storageAddress) {
          const sIface = new Interface(poliDaoStorageAbi as any);
          
          const events = ['FundraiserTitleUpdated', 'FundraiserDescriptionUpdated', 'FundraiserLocationUpdated'];
          const allLogs = await Promise.all(
            events.map(eventName => {
              const ev = (sIface as any).getEvent?.(eventName) ?? (sIface.fragments.find((f: any) => f.type === 'event' && f.name === eventName));
              const topic = (sIface as any).getEventTopic ? (sIface as any).getEventTopic(ev) : (sIface as any).getEventTopic?.(eventName);
              
              return provider.getLogs({
                address: storageAddress as string,
                fromBlock: process.env.NEXT_PUBLIC_STORAGE_START_BLOCK ? BigInt(process.env.NEXT_PUBLIC_STORAGE_START_BLOCK) : 0n,
                toBlock: 'latest',
                topics: [topic],
              });
            })
          );

          const parseStorageLogs = async (logs: any[], kind: string): Promise<Update[]> => {
            const mapped = await Promise.all(
              logs.map(async (log) => {
                try {
                  const decoded = sIface.parseLog(log as any);
                  const args = decoded.args as any;
                  const fid = Number(args?.fundraiserId ?? args?.[0] ?? -1);
                  if (fid !== Number(campaignId)) return null;
                  const block = await provider.getBlock(log.blockHash!);
                  const tsMs = block?.timestamp ? Number(block.timestamp) * 1000 : Date.now();
                  let content = '';
                  if (kind === 'title') content = `Zmieniono tytuł: ${String(args?.newTitle ?? '')}`;
                  if (kind === 'description') content = `Zmieniono opis: ${String(args?.newDescription ?? '')}`;
                  if (kind === 'location') content = `Zmieniono lokalizację: ${String(args?.newLocation ?? '')}`;
                  return { content, timestamp: tsMs } as Update;
                } catch {
                  return null;
                }
              })
            );
            return mapped.filter((x): x is Update => !!x);
          };

          const [titleUpdates, descUpdates, locUpdates] = await Promise.all([
            parseStorageLogs(allLogs[0], 'title'),
            parseStorageLogs(allLogs[1], 'description'),
            parseStorageLogs(allLogs[2], 'location'),
          ]);

          entriesFromUpdates = [...titleUpdates, ...descUpdates, ...locUpdates].sort((a, b) => b.timestamp - a.timestamp);
        }

        if (!disposed) {
          setUpdates(entriesFromUpdates);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Error fetching updates:', err);
        if (!disposed) {
          setUpdates([]);
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchUpdates, 1000);
    const interval = setInterval(fetchUpdates, 25000);
    
    return () => {
      disposed = true;
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [campaignId, updatesAddress, storageAddress]);

  return { updates, loading, setUpdates };
}
