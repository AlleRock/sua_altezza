# 🏔️ SUA ALTEZZA
### Sistemi di Navigazione Reali
*by Mem Software*

---

**Sua Altezza** è una web app PWA pensata per il trekking in montagna.  
Funziona direttamente dal browser, si installa come app nativa su iOS e Android, e sopravvive anche senza connessione.

Niente abbonamenti. Niente account. Niente tracciamento. Solo tu, la montagna e il GPS.

---

## ✨ Funzionalità

| | |
|---|---|
| 🧭 **Bussola digitale** | Rosa dei venti animata con orientamento in gradi |
| ⛰️ **Altimetro** | Quota GPS in tempo reale con fallback DEM (Open-Meteo) |
| 📐 **Pendenza** | Calcolata dinamicamente su finestra mobile, con indicatore cromatico |
| 🗺️ **Mappa multi-layer** | Standard, Rilievo topografico, Satellite (ESRI) |
| 📈 **Profilo altimetrico** | Grafico interattivo con asse in km e posizione corrente evidenziata |
| 🛣️ **Traccia GPX** | Importa qualsiasi file GPX, visualizza il percorso e calcola D+ fatto/residuo |
| 🔵 **Breadcrumb** | Traccia automatica del percorso fatto, salvata in locale |
| 📥 **Cache offline** | Scarica le tile mappa dell'area visibile per usarle senza rete |
| 🆘 **SOS coordinate** | Copia lat/lon negli appunti e apre l'app SMS precompilata |

---

## 🚀 Installazione

Nessuna installazione richiesta. Apri il link nel browser.

Per usarla come app nativa (consigliato in montagna):
- **iOS**: Safari → *Condividi* → *Aggiungi a schermata Home*
- **Android**: Chrome → menu *⋮* → *Aggiungi a schermata Home*

---

## 📁 Struttura file

```
/
├── Sua_Altezza.html   # App principale (tutto in un file)
├── manifest.json      # Configurazione PWA
├── sw.js              # Service Worker (cache offline)
├── icon-192.png       # Icona app 192×192 px
└── icon-512.png       # Icona app 512×512 px
```

> ⚠️ I tre file (`Sua_Altezza.html`, `manifest.json`, `sw.js`) devono stare nella **stessa cartella**.  
> Il Service Worker funziona solo da HTTPS o localhost.

---

## 🧰 Come usare la cache offline

1. Apri la Mappa e naviga sull'area del trekking
2. Fai zoom al livello desiderato
3. Toolbox → **Cache Mappa Area**
4. Attendi il completamento (barra di progresso)

Il Service Worker scarica le tile ai zoom dal corrente fino a -3 livelli (max zoom 17).  
Le tile vengono salvate nel browser e servite automaticamente quando sei offline.

---

## 📡 Permessi richiesti

- **Geolocalizzazione** — per posizione GPS e altimetro
- **Sensori dispositivo** — per la bussola (richiesto esplicitamente su iOS)

---

## 🛠️ Stack tecnico

- [Leaflet.js](https://leafletjs.com/) — mappa interattiva
- [Chart.js](https://www.chartjs.org/) — grafico altimetrico
- [Open-Meteo Elevation API](https://open-meteo.com/) — quota DEM di fallback
- [OpenStreetMap](https://www.openstreetmap.org/) / [OpenTopoMap](https://opentopomap.org/) / ESRI — tile mappa
- Web APIs native: Geolocation, DeviceOrientation, Service Worker, Cache API, Clipboard API

---

## 📜 Licenza

Uso personale libero. Per redistribuzione o uso commerciale contattare Mem Software.

---

<div align="center">
  <sub>Designed with ❤️ for mountain people · Mem Software</sub>
</div>
