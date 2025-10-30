// - Nowy komponent: props { text: string, query?: string }.
// - Jeśli query jest pusty -> zwróć text jako zwykły span.
// - Else: wykonaj bezpieczne podzielenie na fragmenty (case-insensitive) i zrenderuj <span className="search-highlight">matching</span> dla dopasowań.
// - Exportuj i użyj w CampaignCard dla title/description.
