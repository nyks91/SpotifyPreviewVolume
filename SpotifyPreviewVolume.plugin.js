/**
 * @name SpotifyPreviewVolume
 * @version 0.4.2
 * @description Play available Spotify track previews with adjustable volume.
 * @author naykis
 * @source https://github.com/nyks91/SpotifyPreviewVolume
 * @website https://github.com/nyks91/SpotifyPreviewVolume
 * @authorLink https://github.com/nyks91
 */

const NAME = "SpotifyPreviewVolume";
const VERSION = "0.4.2";
const CHANGELOG = [
    {version:"0.4.3",title:"v0.4.3 - Player and volume settings",type:"added",items:["Added a minimal player layout.","Added an option to start every preview at a fixed volume.","The player switch can now be hidden in settings."]},
    {version:"0.4.2",title:"v0.4.2 - Volume control",type:"changed",items:["The volume of Spotify track previews can now be adjusted."]}
];
const REPOSITORY = "nyks91/SpotifyPreviewVolume";
const PLUGIN_FILE = NAME + ".plugin.js";

function newerVersion(candidate, current = VERSION) {
    const parse = value => /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value) ? value.split(".").map(Number) : null;
    const a = parse(candidate), b = parse(current);
    if (!a || !b || !a.every(Number.isSafeInteger)) return false;
    for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
    return false;
}

function releaseAsset(release) {
    if (release?.draft || release?.prerelease || !/^v\d+\.\d+\.\d+$/.test(release?.tag_name || "")) return null;
    const version = release.tag_name.slice(1);
    if (!newerVersion(version)) return null;
    const asset = release.assets?.find(item => item.name === PLUGIN_FILE);
    const expected = `https://github.com/${REPOSITORY}/releases/download/${release.tag_name}/${PLUGIN_FILE}`;
    if (asset?.browser_download_url !== expected || !Number.isInteger(asset.size) || asset.size < 100 || asset.size > 1000000) throw new Error("Invalid update asset.");
    return {version, url: expected};
}

function validateUpdate(source, version) {
    if (typeof source !== "string") throw new Error("Invalid update file.");
    const header = (source.match(/^\s*\/\*\*([\s\S]*?)\*\//)?.[1] || "").replace(/\r\n/g,"\n");
    if (source.length > 1000000 || !header.includes(`@name ${NAME}\n`) ||
        !newerVersion(version) || !new RegExp(`@version ${version.replaceAll(".", "\\.")}\\s`).test(header) ||
        !source.includes(`const VERSION = "${version}";`) || !source.includes("module.exports = class SpotifyPreviewVolume")) throw new Error("Invalid update file.");
    return source;
}

function trackId(value) {
    try {
        const u = new URL(value);
        if (u.protocol !== "https:" || u.hostname !== "open.spotify.com" || u.username || u.password) return null;
        return u.pathname.match(/^\/(?:intl-[a-z-]+\/)?(?:embed\/)?track\/([a-zA-Z0-9]{22})\/?$/)?.[1] || null;
    } catch {return null;}
}

function parsePreview(html, id) {
    const match = html.match(/<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
    if (!match) throw new Error("No Spotify preview data.");
    const entity = JSON.parse(match[1])?.props?.pageProps?.state?.data?.entity;
    if (entity?.id !== id || entity?.type !== "track") throw new Error("No matching track.");
    const u = new URL(entity.audioPreview?.url || "");
    if (u.protocol !== "https:" || u.hostname !== "p.scdn.co" || u.username || u.password || !u.pathname.startsWith("/mp3-preview/")) throw new Error("No playable preview.");
    const image = entity.visualIdentity?.image?.find(image => image.maxWidth >= 64)?.url;
    let cover = null;
    try {
        const artwork = new URL(image);
        if (artwork.protocol === "https:" && !artwork.username && !artwork.password &&
            (artwork.hostname === "i.scdn.co" || artwork.hostname.endsWith(".spotifycdn.com"))) cover = artwork.href;
    } catch {}
    const color=rgb=>rgb && [rgb.red,rgb.green,rgb.blue].every(n=>Number.isInteger(n)&&n>=0&&n<=255)
        ? `rgb(${rgb.red},${rgb.green},${rgb.blue})` : null;
    const background=color(entity.visualIdentity?.backgroundBase);
    const badgeBackground=color(entity.visualIdentity?.backgroundTintedBase);
    const artistColor=color(entity.visualIdentity?.textSubdued);
    return {url:u.href, cover, background, badgeBackground, artistColor, explicit:entity.isExplicit === true, title:entity.title || entity.name || "Spotify track", artist:(entity.artists || []).map(a => a.name).filter(Boolean).join(", "), artists:(entity.artists || []).filter(a=>a.name).map(a=>({name:a.name,id:/^spotify:artist:([a-zA-Z0-9]{22})$/.exec(a.uri || "")?.[1] || null}))};
}

const TURKISH = {
    "v0.4.3 - Player and volume settings":"v0.4.3 - Oynatıcı ve ses ayarları",
    "v0.4.2 - Volume control":"v0.4.2 - Ses kontrolü",
    "Added a minimal player layout.":"Minimal oynatıcı görünümü eklendi.",
    "Added an option to start every preview at a fixed volume.":"Önizlemeler için sabit başlangıç sesi ayarı eklendi.",
    "The player switch can now be hidden in settings.":"Oynatıcı geçiş düğmesi artık ayarlardan gizlenebiliyor.",
    "The volume of Spotify track previews can now be adjusted.":"Spotify şarkı önizlemelerinin ses seviyesi artık ayarlanabiliyor.",
    "{name} has an update available. Would you like to update to version {version}?":"{name} için yeni bir güncelleme mevcut. {version} sürümüne güncellemek ister misin?",
    "Player":"Oynatıcı", "Settings":"Ayarlar",
    "Adjust the preview volume to your liking.":"Önizlemelerin sesini dilediğin gibi ayarla.",
    "Choose between Spotify-style and minimal layouts.":"Spotify tarzı veya minimal görünümü seç.",
    "Set a starting volume for every preview.":"Her önizlemeyi belirlediğin ses seviyesinde başlat.",
    "Show or hide the player switch.":"Oynatıcı geçiş düğmesini istersen gizle.",
    "Spotify-style and minimal player layouts with adjustable preview volume.":"Ses seviyesi ayarlanabilen Spotify tarzı ve minimal oynatıcı görünümleri.",
    "Optional fixed starting volume and a hideable player switch.":"İsteğe bağlı sabit başlangıç sesi ve gizlenebilen oynatıcı geçiş düğmesi.",
    "Track artwork, matching colors and explicit-content badges.":"Şarkı kapağı, uyumlu renkler ve açık içerik etiketleri.",
    "Turkish settings with English as the default language.":"Türkçe ayarlar ve diğer diller için varsayılan İngilizce arayüz.",
    "Update checks start immediately when the plugin starts.":"Güncelleme kontrolü eklenti başlar başlamaz yapılır.",
    "What's new":"Yenilikler", "View changes":"Değişiklikleri göster", "Added":"Eklendi", "Improved":"İyileştirildi",
    "A changes screen appears once after installing a new version.":"Yeni bir sürüm yüklendiğinde değişiklik ekranı bir kez gösterilir.",
    "View the current changes again from plugin settings.":"Geçerli sürümün değişiklikleri ayarlardan tekrar görüntülenebilir.",
    "GitHub releases now include readable notes matching the plugin's changes screen.":"GitHub sürüm yayınlarında eklentinin değişiklik ekranıyla aynı açıklamalar yer alır.",
    "Updates":"Güncellemeler", "Check for updates":"Güncellemeleri kontrol et",
    "Check updates on startup":"Başlangıçta güncellemeleri kontrol et",
    "An update is available":"Yeni sürüm mevcut", "Install update":"Güncelle", "Later":"Daha sonra",
    "You are up to date.":"En güncel sürümü kullanıyorsun.",
    "No published release yet.":"Henüz yayımlanmış bir sürüm yok.",
    "Update check failed. Try again later.":"Güncelleme kontrol edilemedi. Daha sonra tekrar dene.",
    "Update installed. BetterDiscord will reload the plugin.":"Güncelleme yüklendi. BetterDiscord eklentiyi yeniden yükleyecek.",
    "Update could not be installed.":"Güncelleme yüklenemedi.",
    "Check GitHub for new versions. Installation always asks for confirmation.":"GitHub'daki yeni sürümleri kontrol eder. Yüklemeden önce her zaman onay ister.",
    "Loading preview…":"Önizleme yükleniyor…", "Spotify · Short preview":"Spotify · Kısa önizleme",
    "Open in Spotify":"Spotify'da aç", "Preview":"Önizle", "Explicit":"Açık içerik",
    "Explicit content":"Açık içerik", "Play preview":"Önizlemeyi oynat", "Pause preview":"Önizlemeyi duraklat",
    "Preview volume":"Önizleme sesi", "Spotify preview volume":"Spotify önizleme sesi", "Preview position":"Önizleme konumu",
    "Preview player":"Önizleme oynatıcısı", "Spotify player":"Spotify oynatıcısı", "Switch Spotify player":"Oynatıcıyı değiştir",
    "Preview unavailable":"Önizleme mevcut değil", "Switch to Spotify":"Spotify’a geç",
    "Switch to custom player":"Özel oynatıcıya geç",
    "Default player":"Varsayılan oynatıcı", "Choose the initial view. Switch anytime below the card.":"Başlangıç oynatıcısını seç. Kartın altından istediğin zaman değiştirebilirsin.",
    "Custom player":"Özel oynatıcı",
    "Show player switch":"Geçiş düğmesini göster",
    "Switch players below each Spotify card.":"Her Spotify kartının altında oynatıcı değiştirme düğmesini göster.",
    "Appearance":"Görünüm", "Spotify style":"Spotify tarzı", "Minimal":"Minimal",
    "Style of the preview player.":"Önizleme oynatıcısının tasarımı.",
    "Fixed starting volume":"Sabit başlangıç sesi", "Starting volume":"Başlangıç sesi",
    "Start each new preview at the volume below instead of the last used level.":"Her yeni önizlemeyi son kullanılan ses yerine aşağıdaki seviyede başlat."
};

module.exports = class SpotifyPreviewVolume {
    t(text) {
        const lang=document.documentElement?.lang || "en";
        return /^tr(?:-|$)/i.test(lang) ? TURKISH[text] || text : text;
    }

    showTip(element,text,anchor) {
        if(!element?.isConnected)return;
        this.hideTip();
        const tip=document.createElement("div");tip.className="spv-tooltip";tip.setAttribute("role","tooltip");tip.textContent=text;
        tip.style.cssText="position:fixed;z-index:2147483647;pointer-events:none;max-width:280px;padding:7px 10px;border-radius:6px;background:#111214;color:#f2f3f5;box-shadow:0 3px 12px rgba(0,0,0,.35);font:12px/1.4 var(--font-primary,sans-serif);text-align:center;";
        if(element.closest?.(".spv-wrap")) {
            tip.style.padding="4px 7px";tip.style.fontSize="10px";tip.style.lineHeight="1.35";tip.style.borderRadius="4px";tip.style.maxWidth="220px";
        }
        document.body.append(tip);
        const box=anchor || element.getBoundingClientRect(),size=tip.getBoundingClientRect();
        const left=Math.max(8,Math.min(window.innerWidth-size.width-8,box.left+(box.width-size.width)/2));
        const above=box.top>size.height+12;
        tip.style.left=left+"px";tip.style.top=(above ? box.top-size.height-8 : box.bottom+8)+"px";
        const arrow=document.createElement("span");
        arrow.style.cssText="position:absolute;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;";
        arrow.style.left=Math.max(5,Math.min(size.width-13,box.left+box.width/2-left-4))+"px";
        if(above){arrow.style.bottom="-4px";arrow.style.borderTop="4px solid #111214";}
        else{arrow.style.top="-4px";arrow.style.borderBottom="4px solid #111214";}
        tip.append(arrow);
        this.tooltip=tip;this.tooltipOwner=element;
    }

    rangeTip(event,force=false) {
        const element=event.currentTarget;
        if(element.disabled)return;
        const box=element.getBoundingClientRect();
        const fraction=Math.max(0,Math.min(1,Number(element.value)/100));
        const diameter=element.className === "spv-settings-range" ? 14 : 9, radius=diameter/2;
        const x=box.left+radius+Math.max(0,box.width-diameter)*fraction,y=box.top+box.height/2;
        if(force || Math.hypot(event.clientX-x,event.clientY-y)<=radius+2) {
            this.showTip(element,Math.round(Number(element.value))+"%",{left:x-radius,top:y-radius,width:diameter,height:diameter,bottom:y+radius});
        } else if(this.tooltipOwner===element)this.hideTip();
    }

    hideTip() {this.tooltip?.remove();this.tooltip=null;this.tooltipOwner=null;}

    tip(element,text) {
        element.removeAttribute("title");element.setAttribute("data-spv-tip",text);
        element.onmouseenter=element.onfocus=()=>this.showTip(element,element.getAttribute("data-spv-tip"));
        element.onmouseleave=element.onblur=()=>{if(this.tooltipOwner===element)this.hideTip();};
        if(this.tooltipOwner===element)this.showTip(element,text);
    }

    applyLayout(e) {
        const layout=this.layout === "minimal" ? "minimal" : "spotify";
        e.card.setAttribute("data-layout",layout);
        e.wrapper.setAttribute("data-layout",layout);
        e.card.style.setProperty("height",String((layout === "minimal" ? 74 : 80) + (e.timeline.hidden ? 0 : 22))+"px");
    }

    start() {
        if (this.active) return;
        this.active = true;
        this.generation = (this.generation || 0) + 1;
        this.offeredVersion = null;
        const saved = BdApi.Data.load(NAME, "volume");
        this.volume = typeof saved === "number" && Number.isFinite(saved) ? Math.max(0,Math.min(100,saved)) : 10;
        this.fixedVolume = BdApi.Data.load(NAME,"fixedVolume") === true;
        const initial=BdApi.Data.load(NAME,"initialVolume");
        this.initialVolume=typeof initial === "number" && Number.isFinite(initial) ? Math.max(0,Math.min(100,initial)) : 10;
        if(this.fixedVolume)this.volume=this.initialVolume;
        this.defaultView = BdApi.Data.load(NAME, "defaultView") === "custom" ? "custom" : "native";
        this.showSwitch=BdApi.Data.load(NAME,"showSwitch") !== false;
        this.layout=BdApi.Data.load(NAME,"layout") === "minimal" ? "minimal" : "spotify";
        this.entries = new Map(); this.cache = new Map(); this.requests = new Set();
        BdApi.DOM.addStyle(NAME, `
            @font-face{font-family:SPVSpotifyMix;font-style:normal;font-weight:700;font-display:swap;src:url(https://encore.scdn.co/fonts/SpotifyMixUI-Bold-09c45a3a0ce9d2971e62cb26e97760fb.woff2) format("woff2")}
            @font-face{font-family:SPVSpotifyMix;font-style:normal;font-weight:400;font-display:swap;src:url(https://encore.scdn.co/fonts/SpotifyMixUI-Regular-76c92fb1a35c462f73429fa8865163eb.woff2) format("woff2")}
            @font-face{font-family:SPVSpotifyTitle;font-style:normal;font-weight:700;font-display:swap;src:url(https://encore.scdn.co/fonts/SpotifyMixUITitle-Bold-2c79abf9c6697da8b2bf5af3f11e6913.woff2) format("woff2")}
            #app-mount .spv-wrap{position:relative;width:400px;max-width:100%;margin:0}
            #app-mount .spv-wrap[data-layout=minimal]{width:320px}
            #app-mount .spv-wrap[data-view=native]{width:400px}
            #app-mount .spv-wrap>iframe{display:block}
            #app-mount .spv-switch{position:absolute;z-index:2;right:34px;top:7px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;width:20px;height:20px;margin:0;padding:3px;border:0;border-radius:5px;background:rgba(0,0,0,.15);color:#fff;opacity:0;pointer-events:none;transition:opacity .15s ease,background .15s ease;cursor:pointer}
            #app-mount .spv-switch svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
            #app-mount .spv-wrap:hover>.spv-switch,#app-mount .spv-wrap:focus-within>.spv-switch{opacity:1;pointer-events:auto}
            @media(hover:none){#app-mount .spv-wrap>.spv-switch{opacity:1;pointer-events:auto}}
            #app-mount .spv-switch[hidden]{display:none!important}
            #app-mount .spv-switch:focus-visible{outline:2px solid #a5adff;outline-offset:2px}
            #app-mount .spv-switch:hover{color:#fff;background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.2)}
            #app-mount .spv-switch:active{background:rgba(255,255,255,.12)}
            #app-mount .spv-play svg{position:absolute;z-index:1;left:50%;top:50%;display:block;width:17px;height:17px;margin:0!important;transform:translate(-50%,-50%)!important;transition:none!important;fill:currentColor;pointer-events:none}
            #app-mount .spv-card{box-sizing:border-box;display:grid;position:relative;grid-template-columns:72px minmax(0,1fr) 34px;gap:6px 16px;align-items:center;width:400px;max-width:100%;height:80px;padding:9px 12px 9px 9px;margin:0;border-radius:12px;background:var(--spv-background,#263b50);color:#f2f3f5;font-family:SPVSpotifyMix,"SpotifyMixUI",Arial,sans-serif;line-height:1.3;border:0}
            #app-mount .spv-cover{width:64px;height:64px;border-radius:8px;background:#383d43;display:flex;align-items:center;justify-content:center;color:#1ed760;font-size:24px;box-shadow:0 2px 5px rgba(0,0,0,.2);overflow:hidden;position:absolute;left:8px;top:8px}
            #app-mount .spv-cover img{width:100%;height:100%;object-fit:cover;display:block}
            #app-mount .spv-info{position:absolute;left:88px;right:48px;top:14.5px;min-width:0}
            #app-mount .spv-title{font-family:SPVSpotifyTitle,SPVSpotifyMix,Arial,sans-serif;display:block;width:max-content;max-width:100%;color:#fff;font-size:14.5px;line-height:19px;font-weight:700;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;text-decoration:none}
            #app-mount .spv-artist{display:block;color:var(--spv-artist-color,#c3cbd3);font-size:11px;font-weight:400;line-height:15px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;margin-top:0;text-decoration:none}
            #app-mount .spv-title:hover,#app-mount .spv-artist a:hover{text-decoration:underline}
            #app-mount .spv-artist a{color:inherit;text-decoration:none}
            #app-mount .spv-card button{box-sizing:border-box;border:0;cursor:pointer;font-family:inherit;padding:0;display:flex;align-items:center;justify-content:center}
            #app-mount .spv-card[data-layout=spotify] .spv-title{position:relative;top:-.5px}
            #app-mount .spv-card[data-layout=spotify] .spv-cover{box-shadow:0 3px 8px rgba(0,0,0,.30)}
            #app-mount .spv-card[data-layout=spotify] .spv-play[data-icon=play] svg{width:16px;height:16px;left:50%}
            #app-mount .spv-card[data-layout=spotify] .spv-play[data-icon=pause] svg{width:16px;height:16px;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important}
            #app-mount .spv-play{width:29px;height:29px;border-radius:50%;background:#fff;color:var(--spv-background,#263b50);font-size:13px;position:absolute;right:11.5px;top:41.5px}
            #app-mount .spv-play,#app-mount .spv-play:hover,#app-mount .spv-play:active{transform:none!important;padding:0!important;background:transparent!important;transition:none!important;overflow:visible;appearance:none;-webkit-appearance:none;border:0!important;box-shadow:none!important;filter:none!important;min-width:0!important;min-height:0!important;margin:0!important;line-height:0}
            #app-mount .spv-play::before,#app-mount .spv-play::after{content:none!important;display:none!important}
            #app-mount .spv-play .spv-play-disc{position:absolute;left:0;top:0;width:100%;height:100%;box-sizing:border-box;display:block;margin:0;padding:0;border:0;border-radius:50%;background:#fff;box-shadow:none;filter:none;transform:scale(1);transform-origin:center;transition:transform .15s ease;pointer-events:none}
            #app-mount .spv-play:hover:not(:disabled) .spv-play-disc{transform:scale(1.05)}
            #app-mount .spv-play:active:not(:disabled) .spv-play-disc{transform:scale(1.025)}
            #app-mount .spv-play:disabled{opacity:.45;cursor:wait}
            #app-mount .spv-card button:focus-visible,#app-mount .spv-card input:focus-visible{outline:2px solid #1ed760;outline-offset:3px}
            #app-mount .spv-volume{position:absolute;left:auto;right:56px;top:57px;width:112px;height:16px;line-height:1;opacity:0;pointer-events:none;transition:opacity .15s ease;display:flex;gap:7px;align-items:center;grid-column:2;font-size:10px;color:#b5bac1;align-self:start}
            #app-mount .spv-card:hover .spv-volume,#app-mount .spv-card:focus-within .spv-volume{opacity:1;pointer-events:auto}
            @media (hover:none){#app-mount .spv-card .spv-volume{opacity:1;pointer-events:auto}}
            #app-mount .spv-card input[type=range]{appearance:none;-webkit-appearance:none;display:block;height:3px;margin:0;padding:0;border:0;border-radius:8px;background:rgba(255,255,255,.25);accent-color:#fff;cursor:pointer;min-width:0}
            #app-mount .spv-card input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:9px;height:9px;border:0;border-radius:50%;background:#fff}
            #app-mount .spv-volume>span{display:flex;align-items:center;justify-content:center;flex:0 0 14px;height:14px;color:#c3c7ce}
            #app-mount .spv-volume>span svg{display:block;width:14px;height:14px}
            #app-mount .spv-volume input{flex:1;width:0;max-width:none}
            #app-mount .spv-volume output{min-width:25px;font-size:10px;line-height:14px;color:#b5bac1}
            #app-mount .spv-badge[hidden],#app-mount .spv-timeline[hidden]{display:none!important}
            #app-mount .spv-logo{position:absolute;right:8px;top:8.5px;transform:rotate(2deg);width:16px;height:16px;color:#fff;display:block}
            #app-mount .spv-logo svg{width:100%;height:100%}
            #app-mount .spv-badges{position:absolute;left:88px;top:56px;display:flex;gap:4px;align-items:center}
            #app-mount .spv-badge{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;height:16px;font-size:9px;line-height:12px;font-weight:700;width:max-content;padding:2px 5px;border-radius:2px;background:var(--spv-badge-background,rgba(255,255,255,.16));color:#fff}
            #app-mount .spv-timeline{position:absolute;left:9px;right:12px;bottom:9px;display:flex;align-items:center;gap:8px;color:#b5bac1;font-size:10px;font-variant-numeric:tabular-nums}
            #app-mount .spv-timeline input{flex:1;width:0}
            #app-mount .spv-timeline span{min-width:26px}
            #app-mount .spv-card[data-layout=minimal]{width:320px;background:var(--background-secondary,#282b30);border:1px solid rgba(255,255,255,.08);border-radius:8px}
            #app-mount .spv-card[data-layout=minimal] .spv-cover{width:54px;height:54px;left:10px;top:10px;border-radius:5px}
            #app-mount .spv-card[data-layout=minimal] .spv-info{left:76px;right:64px;top:12px;display:flex;flex-direction:column;gap:1px}
            #app-mount .spv-card[data-layout=minimal] .spv-title{font-family:SPVSpotifyMix,Arial,sans-serif;font-size:13px;line-height:17px}
            #app-mount .spv-card[data-layout=minimal] .spv-artist{font-weight:400;line-height:14px;font-size:11px;color:#b5bac1}
            #app-mount .spv-card[data-layout=minimal] .spv-logo{transform:none;right:10px;top:7px;width:20px;height:20px;display:flex;align-items:center;justify-content:center}
            #app-mount .spv-card[data-layout=minimal] .spv-logo svg{display:block;width:14px;height:14px}
            #app-mount .spv-wrap[data-layout=minimal][data-view=custom]>.spv-switch{right:34px;top:7px;width:20px;height:20px;background:transparent;padding:0}
            #app-mount .spv-wrap[data-layout=minimal][data-view=custom]>.spv-switch:hover{background:rgba(255,255,255,.08)}
            #app-mount .spv-wrap[data-layout=minimal][data-view=custom]>.spv-switch svg{width:14px;height:14px}
            #app-mount .spv-card[data-layout=minimal] .spv-play{right:10px;top:37px;width:25px;height:25px;color:#23272a}
            #app-mount .spv-card[data-layout=minimal] .spv-play svg{width:16px;height:16px}
            #app-mount .spv-card[data-layout=minimal] .spv-badges{left:76px;top:48px;gap:5px}
            #app-mount .spv-card[data-layout=minimal] .spv-badge{height:14px;font-size:8px;line-height:1;padding:0 4px;text-align:center;background:#44474e;color:#f2f3f5}
            #app-mount .spv-card[data-layout=minimal] .spv-volume{right:47px;top:52px;width:100px}
            #app-mount .spv-card audio{display:none!important}
        `);
        this.observer = new MutationObserver(() => {
            if (!this.timer) this.timer = setTimeout(() => {this.timer=null;this.scan();},150);
        });
        this.observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["src","href"]});
        this.scan();
        this.showChangelog();
        this.checkUpdates=BdApi.Data.load(NAME,"checkUpdates") !== false;
        if(this.checkUpdates)void this.checkForUpdates();
    }

    scan() {
        if (!this.active) return;
        for (const [host,e] of this.entries) {
            if (!host.isConnected || !e.card.isConnected || (e.iframe && e.iframe.getAttribute("src") !== "about:blank" && trackId(e.iframe.src) !== e.id)) {
                this.remove(e);this.entries.delete(host);
            }
        }
        for (const iframe of document.querySelectorAll('iframe[src*="open.spotify.com"]')) {
            const id=trackId(iframe.src);
            if (id && !this.entries.has(iframe)) this.add(iframe,id,iframe);
        }
        for (const a of document.querySelectorAll('a[href*="open.spotify.com/"]')) {
            const id=trackId(a.href);
            if (!id || a.closest(".spv-card")) continue;
            const host=a.closest('[class*="embedFull"],[class*="embedSpotify"]');
            if (host && !host.querySelector("iframe") && !this.entries.has(host)) this.add(host,id,null);
        }
    }

    add(host,id,iframe) {
        const card=document.createElement("div");card.className="spv-card";
        const cover=document.createElement("div");cover.className="spv-cover";cover.textContent="♫";
        const info=document.createElement("div");info.className="spv-info";
        const text=document.createElement("a");text.className="spv-title";text.textContent=this.t("Loading preview…");text.href=`https://open.spotify.com/track/${id}`;text.target="_blank";text.rel="noopener noreferrer";
        const artist=document.createElement("span");artist.className="spv-artist";artist.textContent=this.t("Spotify · Short preview");
        info.append(text,artist);
        const logo=document.createElement("a");logo.className="spv-logo";logo.href=text.href;logo.target="_blank";logo.rel="noopener noreferrer";this.tip(logo,this.t("Open in Spotify"));logo.setAttribute("aria-label",this.t("Open in Spotify"));
        logo.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="currentColor"/><g fill="none" stroke="var(--spv-background,#263b50)" stroke-linecap="round"><path stroke-width="2" d="M5 9c5-2 10-1.5 14 1"/><path stroke-width="1.7" d="M6 12.5c4-1.5 8-1 12 1"/><path stroke-width="1.5" d="M7 16c3-1 6-.6 9 1"/></g></svg>';
        const badges=document.createElement("div");badges.className="spv-badges";
        const badge=document.createElement("span");badge.className="spv-badge";badge.textContent=this.t("Preview");
        const explicit=document.createElement("span");explicit.className="spv-badge";explicit.textContent="E";this.tip(explicit,this.t("Explicit"));explicit.setAttribute("aria-label",this.t("Explicit content"));explicit.hidden=true;
        badges.append(badge,explicit);
        const button=document.createElement("button");button.className="spv-play";button.type="button";this.setPlayIcon(button,false);button.disabled=true;button.setAttribute("aria-label",this.t("Play preview"));
        const controls=document.createElement("div");controls.className="spv-volume";
        const label=document.createElement("span");label.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 9.5h4L12 6v12l-4.5-3.5h-4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
        const slider=document.createElement("input");slider.type="range";slider.min="0";slider.max="100";slider.value=String(this.volume);slider.setAttribute("aria-label",this.t("Spotify preview volume"));
        const output=document.createElement("output");output.textContent=`${this.volume}%`;
        controls.append(label,slider,output);
        const timeline=document.createElement("div");timeline.className="spv-timeline";timeline.hidden=true;
        const elapsed=document.createElement("span");elapsed.textContent="0:00";
        const seek=document.createElement("input");seek.type="range";seek.min="0";seek.max="100";seek.step="0.1";seek.value="0";seek.disabled=true;seek.setAttribute("aria-label",this.t("Preview position"));
        const duration=document.createElement("span");duration.textContent="0:30";
        timeline.append(elapsed,seek,duration);card.append(cover,info,logo,badges,button,controls,timeline);
        const toggle=document.createElement("button");toggle.className="spv-switch";toggle.type="button";toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4"/></svg>';this.tip(toggle,this.t("Switch Spotify player"));
        const wrapper=document.createElement("div");wrapper.className="spv-wrap";
        const e={wrapper,explicit,timeline,toggle,host,id,iframe,card,text,artist,cover,button,slider,output,seek,elapsed,duration,audio:null,hidden:false,originalSrc:null};
        toggle.hidden=!this.showSwitch;
        this.applyLayout(e);
        slider.onmousemove=event=>this.rangeTip(event);
        slider.onmouseleave=slider.onblur=()=>{if(this.tooltipOwner===slider)this.hideTip();};
        slider.oninput=()=>this.setVolume(Number(slider.value));button.onclick=()=>this.play(e);
        host.insertAdjacentElement("beforebegin",wrapper);wrapper.append(host,card,toggle);this.entries.set(host,e);
        e.display=host.style.getPropertyValue("display");e.priority=host.style.getPropertyPriority("display");
        toggle.onmousedown=event=>{event.preventDefault();toggle.focus?.({preventScroll:true});};
        toggle.ondblclick=event=>event.preventDefault();
        toggle.style.userSelect="none";
        toggle.onclick=()=>this.setView(e,!e.hidden);
        this.setView(e,this.defaultView==="custom");
        seek.oninput=()=>{if(e.audio && Number.isFinite(e.audio.duration))e.audio.currentTime=Number(seek.value)/100*e.audio.duration;};
    }

    async prepare(e) {
        const generation=this.generation;
        try {
            const preview=await this.getPreview(e.id);
            if(!this.active || generation!==this.generation || this.entries.get(e.host)!==e || !e.card.isConnected)return;
            if(preview.background)e.card.style.setProperty("--spv-background",preview.background);
            if(preview.badgeBackground)e.card.style.setProperty("--spv-badge-background",preview.badgeBackground);
            if(preview.artistColor)e.card.style.setProperty("--spv-artist-color",preview.artistColor);
            e.explicit.hidden=!preview.explicit;
            e.preview=preview;e.text.textContent=preview.title;
            e.artist.textContent="";
            for(const [index,a] of (preview.artists || []).entries()) {
                if(index){const comma=document.createElement("span");comma.textContent=", ";e.artist.append(comma);}
                const link=document.createElement("a");link.textContent=a.name;link.href=a.id ? `https://open.spotify.com/artist/${a.id}` : e.text.href;link.target="_blank";link.rel="noopener noreferrer";e.artist.append(link);
            }
            if(!preview.artists?.length)e.artist.textContent=preview.artist || "Spotify";
            
            if(preview.cover){const image=document.createElement("img");image.src=preview.cover;image.alt="";e.cover.textContent="";e.cover.append(image);}
            e.button.disabled=false;
        } catch(error) {
            if(this.active && generation===this.generation && e.card.isConnected){this.setView(e,false);this.tip(e.toggle,this.t("Preview unavailable"));e.toggle.disabled=true;}
        }
    }

    async getPreview(id) {
        if (!/^[a-zA-Z0-9]{22}$/.test(id)) throw new Error("Invalid track.");
        if (this.cache.has(id)) return this.cache.get(id);
        const controller=new AbortController();this.requests.add(controller);
        const timer=setTimeout(()=>controller.abort(),15000);
        try {
            const response=await BdApi.Net.fetch(`https://open.spotify.com/embed/track/${id}`,{signal:controller.signal});
            if (!response.ok) throw new Error(`Spotify HTTP ${response.status}`);
            const preview=parsePreview(await response.text(),id);
            if (this.active) {if(this.cache.size>=40)this.cache.delete(this.cache.keys().next().value);this.cache.set(id,preview);}
            return preview;
        } finally {clearTimeout(timer);this.requests.delete(controller);}
    }

    async play(e) {
        if(e.button.disabled)return;
        if(e.audio && !e.audio.paused){e.audio.pause();return;}
        const generation=this.generation;e.button.disabled=true;
        try {
            const preview=e.preview || await this.getPreview(e.id);
            if(!this.active || generation!==this.generation || this.entries.get(e.host)!==e || !e.card.isConnected)return;
            for(const other of this.entries.values())other.audio?.pause();
            if(!e.audio) {
                if(this.fixedVolume)this.setVolume(this.initialVolume);
                const audio=document.createElement("audio");audio.controls=false;audio.preload="none";audio.src=preview.url;audio.volume=this.volume/100;
                const update=()=>{
                    const format=n=>`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,"0")}`;
                    e.elapsed.textContent=format(audio.currentTime||0);
                    if(Number.isFinite(audio.duration)&&audio.duration>0){e.duration.textContent=format(audio.duration);e.seek.disabled=false;e.seek.value=String((audio.currentTime||0)/audio.duration*100);}
                };
                audio.ontimeupdate=update;audio.onloadedmetadata=update;
                audio.onplay=()=>{e.timeline.hidden=false;this.applyLayout(e);for(const other of this.entries.values())if(other!==e)other.audio?.pause();this.setPlayIcon(e.button,true);e.button.setAttribute("aria-label",this.t("Pause preview"));};
                audio.onpause=audio.onended=()=>{this.setPlayIcon(e.button,false);e.button.setAttribute("aria-label",this.t("Play preview"));};
                audio.onerror=()=>{this.setView(e,false);this.tip(e.toggle,this.t("Preview unavailable"));e.toggle.disabled=true;};
                e.audio=audio;e.card.insertBefore(audio,e.button);
            }
            if(e.iframe && !e.originalSrc){e.originalSrc=e.iframe.getAttribute("src");e.iframe.src="about:blank";}
            if(e.audio.ended)e.audio.currentTime=0;
            await e.audio.play();
            if(!this.active || generation!==this.generation || !e.card.isConnected)return;
        } catch(error) {
            if(this.active && generation===this.generation && e.card.isConnected) {
                this.setView(e,false);this.tip(e.toggle,this.t("Preview unavailable"));e.toggle.disabled=true;
            }
        } finally {e.button.disabled=false;}
    }

    setPlayIcon(button,paused) {
        button.setAttribute("data-icon",paused ? "pause" : "play");
        button.innerHTML='<span class="spv-play-disc" aria-hidden="true"></span>'+(paused
            ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>'
            : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.8v16.4L21 12z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>');
    }

    setView(e,custom) {
        e.wrapper.setAttribute("data-view",custom ? "custom" : "native");
        if(custom) {
            e.host.style.setProperty("display","none","important");e.hidden=true;
            e.card.style.removeProperty("display");
            if(!e.preview && !e.ready)e.ready=this.prepare(e);
        } else {
            e.audio?.pause();this.restore(e);
            e.card.style.setProperty("display","none","important");
        }
        this.tip(e.toggle,this.t(custom ? "Switch to Spotify" : "Switch to custom player"));
        e.toggle.setAttribute("aria-label",this.t(custom ? "Switch to Spotify" : "Switch to custom player"));
    }

    showChangelog(manual=false) {
        if(!manual && BdApi.Data.load(NAME,"lastChangelogVersion")===VERSION)return;
        if(typeof BdApi.UI?.showChangelogModal!=="function")return;
        try {
            BdApi.UI.showChangelogModal({title:NAME,subtitle:`v${VERSION}`,
                changes:CHANGELOG.filter(section=>!newerVersion(section.version,VERSION)).map(section=>({...section,title:this.t(section.title),items:section.items.map(item=>this.t(item))}))});
            if(!manual)BdApi.Data.save(NAME,"lastChangelogVersion",VERSION);
        } catch(error) {console.warn(`[${NAME}] Could not show changelog.`,error);}
    }

    async updateFetch(url) {
        const controller=new AbortController();
        this.requests ||= new Set();this.requests.add(controller);
        const timer=setTimeout(()=>controller.abort(),15000);
        try {
            const response=await BdApi.Net.fetch(url,{signal:controller.signal,headers:{"Accept":"application/vnd.github+json","User-Agent":`${NAME}/${VERSION}`}});
            if(response.status===404)return null;
            if(!response.ok)throw new Error(`Update HTTP ${response.status}`);
            const text=await response.text();
            if(text.length>1000000)throw new Error("Update response too large.");
            return text;
        } finally {clearTimeout(timer);this.requests.delete(controller);}
    }

    async checkForUpdates(manual=false) {
        if(this.checkingUpdate)return;
        this.checkingUpdate=true;const generation=this.generation;
        try {
            const body=await this.updateFetch(`https://api.github.com/repos/${REPOSITORY}/releases/latest`);
            if(!this.active || generation!==this.generation)return;
            if(body===null){if(manual)BdApi.UI.showToast(this.t("No published release yet."),{type:"info"});return;}
            const update=releaseAsset(JSON.parse(body));
            if(!update){if(manual)BdApi.UI.showToast(this.t("You are up to date."),{type:"success"});return;}
            if(!manual && this.offeredVersion===update.version)return;
            this.offeredVersion=update.version;
            BdApi.UI.showConfirmationModal(this.t("An update is available"),
                this.t("{name} has an update available. Would you like to update to version {version}?").replace("{name}",NAME).replace("{version}",update.version),
                {confirmText:this.t("Install update"),cancelText:this.t("Later"),onConfirm:()=>this.installUpdate(update,generation)});
        } catch(error) {
            if(this.active && generation===this.generation && manual)BdApi.UI.showToast(this.t("Update check failed. Try again later."),{type:"error"});
        } finally {this.checkingUpdate=false;}
    }

    async installUpdate(update,generation=this.generation) {
        if(!this.active || this.installingUpdate || generation!==this.generation)return;
        this.installingUpdate=true;
        try {
            if(update.url!==`https://github.com/${REPOSITORY}/releases/download/v${update.version}/${PLUGIN_FILE}` || !newerVersion(update.version))throw new Error("Invalid update URL.");
            const source=await this.updateFetch(update.url);
            if(!this.active || generation!==this.generation)return;
            validateUpdate(source,update.version);
            const fs=require("fs"),path=require("path");
            const target=path.join(BdApi.Plugins.folder,PLUGIN_FILE);
            // Only replace this installed plugin after validating the download.
            if(!fs.existsSync(target))throw new Error("Installed plugin file not found.");
            const temporary=target+".update";
            fs.writeFileSync(temporary,source,"utf8");
            try {fs.renameSync(temporary,target);}
            finally {if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
            BdApi.UI.showToast(this.t("Update installed. BetterDiscord will reload the plugin."),{type:"success"});
        } catch(error) {
            if(this.active)BdApi.UI.showToast(this.t("Update could not be installed."),{type:"error"});
        } finally {this.installingUpdate=false;}
    }

    changeSetting(id,value) {
        if(id==="layout" && ["spotify","minimal"].includes(value)) {
            this.layout=value;for(const e of this.entries?.values() || [])this.applyLayout(e);
        } else if(id==="defaultView" && ["native","custom"].includes(value)) {
            this.defaultView=value;for(const e of this.entries?.values() || [])if(!e.toggle.disabled)this.setView(e,value==="custom");
        } else if(id==="showSwitch"){this.showSwitch=value===true;for(const e of this.entries?.values() || [])e.toggle.hidden=!this.showSwitch;
        } else if(id==="fixedVolume")this.fixedVolume=value===true;
        else if(id==="checkUpdates"){this.checkUpdates=value===true;if(!this.checkUpdates)clearTimeout(this.updateTimer);}
        else if(id==="initialVolume")this.initialVolume=Math.round(Math.max(0,Math.min(100,Number(value)||0)));
        else return;
        BdApi.Data.save(NAME,id,this[id]);
    }

    getSettingsPanel() {
        const plugin=this,React=BdApi.React,h=React.createElement;
        function Settings() {
            const [values,setValues]=React.useState(()=>({
                defaultView:BdApi.Data.load(NAME,"defaultView") === "custom" ? "custom" : "native",
                layout:BdApi.Data.load(NAME,"layout") === "minimal" ? "minimal" : "spotify",
                checkUpdates:BdApi.Data.load(NAME,"checkUpdates") !== false,
                showSwitch:BdApi.Data.load(NAME,"showSwitch") !== false,
                fixedVolume:BdApi.Data.load(NAME,"fixedVolume") === true,
                initialVolume:plugin.initialVolume ?? 10
            }));
            const hover=text=>({onMouseEnter:event=>plugin.showTip(event.currentTarget,text),onMouseLeave:()=>plugin.hideTip(),onFocus:event=>plugin.showTip(event.currentTarget,text),onBlur:()=>plugin.hideTip()});
            React.useEffect(()=>()=>plugin.hideTip(),[]);
            const change=(id,value)=>{plugin.changeSetting(id,value);setValues(previous=>({...previous,[id]:plugin[id]}));};
            const row={padding:"18px 0",borderBottom:"1px solid rgba(255,255,255,.08)"};
            const title={fontSize:14,fontWeight:600,marginBottom:8,color:"#f2f3f5"};
            const choices=(id,options)=>h("div",{role:"group","aria-label":plugin.t(id==="layout" ? "Appearance" : "Default player"),style:{display:"flex",gap:4,padding:4,borderRadius:9,background:"#1e1f22",border:"1px solid rgba(255,255,255,.04)"}},...options.map(([value,label])=>h("button",{
                ...hover(plugin.t(label)),key:value,type:"button","aria-pressed":values[id]===value,onClick:()=>change(id,value),
                style:{flex:1,padding:"9px 12px",borderRadius:5,border:0,cursor:"pointer",font:"inherit",fontSize:13,fontWeight:500,color:values[id]===value ? "#fff" : "#b5bac1",transition:"background .15s ease,color .15s ease",boxShadow:values[id]===value ? "0 1px 3px rgba(0,0,0,.2)" : "none",background:values[id]===value ? "#404249" : "transparent"}
            },plugin.t(label))));
            const updates=h("div",{style:row},
                h("div",{style:{...title,display:"flex",alignItems:"center",justifyContent:"space-between"}},plugin.t("Updates"),
                    h("span",{style:{fontSize:12,fontWeight:400,color:"#b5bac1"}},"v"+VERSION)),
                h("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}},
                    h("span",{style:{fontSize:13}},plugin.t("Check updates on startup")),
                    h("button",{type:"button",role:"switch","aria-checked":values.checkUpdates,"aria-label":plugin.t("Check updates on startup"),onClick:()=>change("checkUpdates",!values.checkUpdates),
                        style:{position:"relative",width:38,height:22,padding:0,border:0,borderRadius:20,cursor:"pointer",background:values.checkUpdates ? "#5865f2" : "#555760"}},
                        h("span",{style:{position:"absolute",top:3,left:3,width:16,height:16,borderRadius:"50%",background:"#fff",transform:values.checkUpdates ? "translateX(16px)" : "none"}}))),
                h("p",{style:{fontSize:12,lineHeight:1.5,margin:"8px 0 12px"}},plugin.t("Check GitHub for new versions. Installation always asks for confirmation.")),
                h("div",{style:{display:"flex",gap:8,flexWrap:"wrap"}},
                    ...[["Check for updates",()=>plugin.checkForUpdates(true)],["View changes",()=>plugin.showChangelog(true)]].map(([label,onClick])=>
                        h("button",{key:label,type:"button",onClick,style:{padding:"8px 12px",border:0,borderRadius:5,background:"#404249",color:"#fff",font:"inherit",fontSize:12,cursor:"pointer"}},plugin.t(label)))));
            return h("div",{className:"spv-settings",style:{padding:"0 4px 8px",fontFamily:"var(--font-primary,sans-serif)",color:"#b5bac1"}},
                h("style",null,`
                    .spv-settings button:focus-visible,.spv-settings input:focus-visible{outline:2px solid #a5adff;outline-offset:3px}
                    .spv-settings .spv-settings-range{appearance:none;-webkit-appearance:none;display:block;height:6px!important;padding:0!important;border:0!important;border-radius:999px;background:linear-gradient(to right,#7b86f8 0%,#7b86f8 var(--spv-progress),#41434a var(--spv-progress),#41434a 100%)!important;cursor:pointer}
                    .spv-settings .spv-settings-range::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;border:0;background:#f2f3f5;box-shadow:0 1px 4px rgba(0,0,0,.35)}
                    .spv-settings .spv-settings-range::-moz-range-thumb{width:14px;height:14px;border-radius:50%;border:0;background:#f2f3f5}
                    .spv-settings .spv-settings-range:disabled{cursor:default}
                    .spv-settings .spv-number-box{transition:box-shadow .15s ease}
                    .spv-settings .spv-number-box:focus-within{box-shadow:inset 0 0 0 1px rgba(255,255,255,.28)}
                    .spv-settings .spv-number-box input:focus,.spv-settings .spv-number-box input:focus-visible{outline:none!important;box-shadow:none!important}
                    .spv-settings input[type=number]::-webkit-inner-spin-button,.spv-settings input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
                `),
                h("div",{style:row},h("div",{style:title},plugin.t("Default player")),choices("defaultView",[["native","Spotify"],["custom","Custom player"]])),
                h("div",{style:row},h("div",{style:title},plugin.t("Appearance")),choices("layout",[["spotify","Spotify style"],["minimal","Minimal"]])),
                h("div",{style:row},
                    h("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,...title}},plugin.t("Show player switch"),
                        h("button",{...hover(plugin.t("Show player switch")),type:"button",role:"switch","aria-checked":values.showSwitch,"aria-label":plugin.t("Show player switch"),onClick:()=>change("showSwitch",!values.showSwitch),
                            style:{boxSizing:"border-box",position:"relative",width:38,height:22,flexShrink:0,padding:0,border:0,borderRadius:20,cursor:"pointer",background:values.showSwitch ? "#5865f2" : "#555760",transition:"background .15s ease"}},
                            h("span",{style:{position:"absolute",top:3,left:3,width:16,height:16,borderRadius:"50%",background:"#fff",transform:values.showSwitch ? "translateX(16px)" : "translateX(0)",transition:"transform .15s ease"}}))),
                    h("p",{style:{fontSize:12,lineHeight:1.5,margin:0}},plugin.t("Switch players below each Spotify card."))),
                h("div",{style:{...row,borderBottom:0}},
                    h("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,...title}},plugin.t("Fixed starting volume"),
                        h("button",{...hover(plugin.t("Fixed starting volume")),type:"button",role:"switch","aria-checked":values.fixedVolume,"aria-label":plugin.t("Fixed starting volume"),onClick:()=>change("fixedVolume",!values.fixedVolume),
                            style:{boxSizing:"border-box",position:"relative",width:38,height:22,flexShrink:0,padding:0,border:0,borderRadius:20,cursor:"pointer",background:values.fixedVolume ? "#5865f2" : "#555760",transition:"background .15s ease"}},
                            h("span",{style:{position:"absolute",top:3,left:3,width:16,height:16,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,.2)",transform:values.fixedVolume ? "translateX(16px)" : "translateX(0)",transition:"transform .15s ease"}}))),
                    h("p",{style:{fontSize:12,lineHeight:1.5,margin:"0 0 14px"}},plugin.t("Start each new preview at the volume below instead of the last used level.")),
                    h("div",{style:{display:"flex",gap:14,alignItems:"center",opacity:values.fixedVolume ? 1 : .45}},
                        h("input",{onMouseMove:event=>plugin.rangeTip(event),onMouseLeave:()=>plugin.hideTip(),onBlur:()=>plugin.hideTip(),className:"spv-settings-range",type:"range",min:0,max:100,step:1,value:values.initialVolume,disabled:!values.fixedVolume,"aria-label":plugin.t("Starting volume"),onChange:event=>{change("initialVolume",Number(event.target.value));if(plugin.tooltipOwner===event.currentTarget)plugin.rangeTip(event,true);},style:{flex:1,minWidth:0,margin:"8px 0","--spv-progress":values.initialVolume+"%"}}),
                        h("div",{className:"spv-number-box",style:{display:"flex",alignItems:"center",gap:2,padding:"5px 7px",borderRadius:5,background:"#1e1f22",color:"#f2f3f5"}},
                            h("input",{type:"number",min:0,max:100,step:1,value:values.initialVolume,disabled:!values.fixedVolume,"aria-label":plugin.t("Starting volume"),
                                onChange:event=>{const raw=event.target.value;if(raw==="")setValues(previous=>({...previous,initialVolume:""}));else change("initialVolume",Number(raw));},
                                onBlur:()=>{if(values.initialVolume==="")change("initialVolume",plugin.initialVolume ?? 10);},
                                style:{appearance:"textfield",width:32,padding:0,border:0,background:"transparent",color:"inherit",font:"inherit",fontSize:12,textAlign:"right"}}),
                            h("span",{style:{fontSize:12}},"%")))),updates);

        }
        return h(Settings);
    }

    restore(e) {
        if(e.hidden) {
            if(e.iframe && e.originalSrc && e.iframe.getAttribute("src")==="about:blank")e.iframe.setAttribute("src",e.originalSrc);
            if(e.display)e.host.style.setProperty("display",e.display,e.priority);else e.host.style.removeProperty("display");
            e.hidden=false;e.originalSrc=null;
        }
    }

    remove(e) {
        if(e.audio){e.audio.onerror=null;e.audio.onplay=null;e.audio.onpause=null;e.audio.onended=null;e.audio.ontimeupdate=null;e.audio.onloadedmetadata=null;e.audio.pause();e.audio.removeAttribute("src");e.audio.load();}
        if(this.tooltipOwner && [e.toggle,e.slider,e.button,e.text,e.artist].includes(this.tooltipOwner))this.hideTip();
        this.restore(e);
        if(e.wrapper.isConnected && e.host.isConnected)e.wrapper.insertAdjacentElement("beforebegin",e.host);
        e.card.remove();e.toggle.remove();e.wrapper.remove();
    }

    setVolume(value) {
        this.volume=Math.max(0,Math.min(100,Number.isFinite(value)?value:10));BdApi.Data.save(NAME,"volume",this.volume);
        for(const e of this.entries.values()){e.slider.value=String(this.volume);e.output.textContent=`${this.volume}%`;if(this.tooltipOwner===e.slider)this.rangeTip({currentTarget:e.slider},true);if(e.audio)e.audio.volume=this.volume/100;}
    }

    stop() {
        clearTimeout(this.updateTimer);this.updateTimer=null;
        this.hideTip();this.active=false;this.generation++;this.observer?.disconnect();clearTimeout(this.timer);this.timer=null;
        for(const controller of this.requests||[])controller.abort();
        for(const e of this.entries?.values()||[])this.remove(e);
        this.entries?.clear();this.cache?.clear();BdApi.DOM.removeStyle(NAME);
    }
};
