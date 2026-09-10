/**
 * LG Refrigerator Card for Home Assistant
 * ========================================
 * Refrigerator card (LG ThinQ) with freezer/fridge setpoints,
 * door status, filters, water usage, express freeze and notifications.
 *
 * License: MIT
 *
 */

const CARD_VERSION = "1.0.6";

class LgRefrigeratorCard extends HTMLElement {
    static STRINGS = {
        en: {
            name: "Refrigerator",
            door_open: "OPEN",
            door_closed: "CLOSED",
            door_nodata: "NO DATA",
            air_filter: "Air filter",
            water_filter: "Water filter",
            water_used: "Water filtered",
            express_on: "Express Freeze on",
            express_off: "Express Freeze off",
            tip_express: "Express Freeze",
            tip_dismiss: "Dismiss",
            notification_title: "ALERT",
            zone1_label: "FRIDGE",
            zone2_label: "FREEZER",
        },
        fr: {
            name: "Réfrigérateur",
            door_open: "OUVERTE",
            door_closed: "FERMÉE",
            door_nodata: "PAS DE DONNÉES",
            air_filter: "Filtre à air",
            water_filter: "Filtre à eau",
            water_used: "Eau filtrée",
            express_on: "Freeze Express activé",
            express_off: "Freeze Express désactivé",
            tip_express: "Freeze Express",
            tip_dismiss: "Ignorer",
            notification_title: "ALERTE",
            zone1_label: "RÉFRIGÉRATEUR",
            zone2_label: "CONGÉLATEUR",
        },
        es: {
            name: "Frigorífico",
            door_open: "ABIERTA",
            door_closed: "CERRADA",
            door_nodata: "SIN DATOS",
            air_filter: "Filtro de aire",
            water_filter: "Filtro de agua",
            water_used: "Agua filtrada",
            express_on: "Congelación rápida activada",
            express_off: "Congelación rápida desactivada",
            tip_express: "Congelación rápida",
            tip_dismiss: "Descartar",
            notification_title: "ALERTA",
            zone1_label: "NEVERA",
            zone2_label: "CONGELADOR",
        },
        it: {
            name: "Frigorifero",
            door_open: "APERTA",
            door_closed: "CHIUSA",
            door_nodata: "NESSUN DATO",
            air_filter: "Filtro dell'aria",
            water_filter: "Filtro dell'acqua",
            water_used: "Acqua filtrata",
            express_on: "Congelamento rapido attivo",
            express_off: "Congelamento rapido disattivo",
            tip_express: "Congelamento rapido",
            tip_dismiss: "Ignora",
            notification_title: "AVVISO",
            zone1_label: "FRIGORIFERO",
            zone2_label: "CONGELATORE",
        },
        pt: {
            name: "Frigorífico",
            door_open: "ABERTA",
            door_closed: "FECHADA",
            door_nodata: "SEM DADOS",
            air_filter: "Filtro de ar",
            water_filter: "Filtro de água",
            water_used: "Água filtrada",
            express_on: "Congelação rápida ativada",
            express_off: "Congelação rápida desativada",
            tip_express: "Congelação rápida",
            tip_dismiss: "Ignorar",
            notification_title: "ALERTA",
            zone1_label: "FRIGORÍFICO",
            zone2_label: "CONGELADOR",
        },
        de: {
            name: "Kühlschrank",
            door_open: "OFFEN",
            door_closed: "GESCHLOSSEN",
            door_nodata: "KEINE DATEN",
            air_filter: "Luftfilter",
            water_filter: "Wasserfilter",
            water_used: "Gefiltertes Wasser",
            express_on: "Schnellgefrieren an",
            express_off: "Schnellgefrieren aus",
            tip_express: "Schnellgefrieren",
            tip_dismiss: "Ausblenden",
            notification_title: "WARNUNG",
            zone1_label: "KÜHLSCHRANK",
            zone2_label: "GEFRIERSCHRANK",
        },
        nl: {
            name: "Koelkast",
            door_open: "OPEN",
            door_closed: "GESLOTEN",
            door_nodata: "GEEN DATA",
            air_filter: "Luchtfilter",
            water_filter: "Waterfilter",
            water_used: "Gefilterd water",
            express_on: "Snelvriezen aan",
            express_off: "Snelvriezen uit",
            tip_express: "Snelvriezen",
            tip_dismiss: "Negeren",
            notification_title: "MELDING",
            zone1_label: "KOELKAST",
            zone2_label: "VRIEZER",
        },
    };

    static DEFAULTS = {
        fridge_layout: "french_door",
        fridge_visual_position: "left",
        hide_fridge_visual: false,
        no_notification_states: ["none", "unknown", "unavailable", ""],
    };

    static NO_FILTER_STATES = ["unknown", "unavailable", ""];

    static ZONE_FALLBACK_BOUNDS = {
        1: {
            min: 1,
            max: 7,
            step: 1
        },
        2: {
            min: -24,
            max: -14,
            step: 1
        },
    };

    static VISUAL_ORDER = {
        left: {
            visual: 0,
            zones: 1
        },
        right: {
            visual: 1,
            zones: 0
        },
    };

    static getConfigElement() {
        return document.createElement("lg-refrigerator-card-editor");
    }

    static getStubConfig() {
        return {
        };
    }

    static languageDisplayName(code) {
        try {
            const displayNames = new Intl.DisplayNames([code], {
                type: "language"
            });
            const name = displayNames.of(code);
            return name ? name.charAt(0).toUpperCase() + name.slice(1) : code;
        } catch (error) {
            return code;
        }
    }

    setConfig(config) {
        this._config = {
            ...LgRefrigeratorCard.DEFAULTS,
            ...config,
        };

        this._built = false;
        this._dismissedNotificationKey = this._loadDismissedNotificationKey();

        if (this._hass) {
            this._build();
            this._update();
        }
    }

    set hass(hass) {
        this._hass = hass;
        if (!this._built)
            this._build();
        this._update();
    }

    getCardSize() {
        return 5;
    }

    get _t() {
        const strings = LgRefrigeratorCard.STRINGS;

        const configured = String(this._config?.language || "").toLowerCase();
        if (configured && strings[configured])
            return strings[configured];

        const profileLanguage = (
            this._hass?.locale?.language || this._hass?.language || "").toLowerCase();

        if (profileLanguage) {
            if (strings[profileLanguage])
                return strings[profileLanguage];
            const base = profileLanguage.split(/[-_]/)[0];
            if (strings[base])
                return strings[base];
        }

        return strings.en;
    }

    get _locale() {
        return (
            this._config?.language ||
            this._hass?.locale?.language ||
            this._hass?.language ||
            "en");
    }

    _st(entityId) {
        return entityId ? this._hass?.states?.[entityId] : undefined;
    }

    _num(entityId) {
        const state = this._st(entityId);
        if (!state)
            return null;
        const value = Number.parseFloat(state.state);
        return Number.isFinite(value) ? value : null;
    }

    _fmtNum(value, digits = 1) {
        const number = Number.parseFloat(value);
        if (!Number.isFinite(number))
            return null;

        return digits > 0
         ? String(Number.parseFloat(number.toFixed(digits)))
         : String(Math.round(number));
    }

    _moreInfo(entityId) {
        if (!entityId)
            return;

        this.dispatchEvent(new CustomEvent("hass-more-info", {
                detail: {
                    entityId
                },
                bubbles: true,
                composed: true,
            }));
    }

    _zoneBounds(zone) {
        const config = this._config;
        const entity = config[`zone${zone}_temp_entity`];
        const state = this._st(entity);
        const fallback = LgRefrigeratorCard.ZONE_FALLBACK_BOUNDS[zone];

        const attrMin = state?.attributes?.min;
        const attrMax = state?.attributes?.max;
        const attrStep = state?.attributes?.step;

        const min = Number.isFinite(attrMin) ? attrMin : fallback.min;
        const max = Number.isFinite(attrMax) ? attrMax : fallback.max;
        const step = Number.isFinite(attrStep) ? attrStep : fallback.step;

        return {
            min,
            max,
            step
        };
    }

    _formatEventType(rawType) {
        if (!rawType)
            return null;
        return String(rawType).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }

    _relativeTime(isoString) {
        const date = new Date(isoString);
        if (Number.isNaN(date.getTime()))
            return null;

        const diffMs = date.getTime() - Date.now();
        const diffMin = Math.round(diffMs / 60000);
        const rtf = new Intl.RelativeTimeFormat(this._locale, {
            numeric: "auto"
        });

        if (Math.abs(diffMin) < 60)
            return rtf.format(diffMin, "minute");
        const diffHour = Math.round(diffMin / 60);
        if (Math.abs(diffHour) < 24)
            return rtf.format(diffHour, "hour");
        const diffDay = Math.round(diffHour / 24);
        return rtf.format(diffDay, "day");
    }

    _setZoneValue(zone, delta) {
        const config = this._config;
        const entityId = config[`zone${zone}_temp_entity`];
        if (!entityId || !this._hass)
            return;

        const current = this._num(entityId);
        if (current === null)
            return;

        const { min, max, step } = this._zoneBounds(zone);
        const next = Math.max(min, Math.min(max, current + delta * step));
        if (next === current)
            return;

        this._hass.callService("number", "set_value", {
            entity_id: entityId,
            value: next
        });
    }

    _dismissedStorageKey() {
        const entity = this._config?.notification_entity;
        return entity ? `lg-refrigerator-card-dismissed:${entity}` : null;
    }

    _loadDismissedNotificationKey() {
        const storageKey = this._dismissedStorageKey();
        if (!storageKey)
            return null;

        try {
            return window.localStorage.getItem(storageKey);
        } catch (error) {
            return null;
        }
    }

    _saveDismissedNotificationKey(key) {
        const storageKey = this._dismissedStorageKey();
        if (!storageKey)
            return;

        try {
            if (key === null || key === undefined)
                window.localStorage.removeItem(storageKey);
            else
                window.localStorage.setItem(storageKey, key);
        } catch (error) {
            // Ignore storage errors (e.g. private browsing mode with storage disabled).
        }
    }

    // Renders the LG control panel / display
    _controlPanelSvg(px, py) {
        return `
          <rect x="${px}" y="${py}" width="26" height="35" rx="3" fill="#2b2e33"/>
          <rect x="${px + 2}" y="${py + 4}" width="22" height="17" rx="1.5" fill="#0d3b4d"/>
          <text x="${px + 13}" y="${py + 15.5}" text-anchor="middle" font-size="7" font-weight="700" font-family="monospace" fill="#6fd0e0" id="displayLg">LG</text>
          <text x="${px + 13}" y="${py + 10.8}" text-anchor="middle" font-size="5.2" font-weight="700" font-family="monospace" fill="#6fd0e0" id="displayZone1Text"></text>
          <text x="${px + 13}" y="${py + 18.3}" text-anchor="middle" font-size="5.2" font-weight="700" font-family="monospace" fill="#6fd0e0" id="displayZone2Text"></text>
          <circle cx="${px + 5.5}" cy="${py + 24}" r="1.5" fill="#5a5e64"/>
          <circle cx="${px + 10.5}" cy="${py + 24}" r="1.5" fill="#5a5e64"/>
          <circle cx="${px + 15.5}" cy="${py + 24}" r="1.5" fill="#5a5e64"/>
          <circle cx="${px + 20.5}" cy="${py + 24}" r="1.5" fill="#5a5e64"/>
          <path d="M${px + 5} ${py + 27} h16 a2 2 0 0 1 2 2 v3 a2 2 0 0 1 -2 2 h-16 a2 2 0 0 1 -2 -2 v-3 a2 2 0 0 1 2 -2 z" fill="#1c1e21"/>
        `;
    }

    // French Door
    _frenchDoorMarkup() {
        return `
          <rect x="8" y="11" width="38" height="117" rx="5" fill="url(#frDoor)" stroke="#9aa0a6" stroke-width=".6"/>
          <rect x="50" y="11" width="38" height="117" rx="5" fill="url(#frDoor)" stroke="#9aa0a6" stroke-width=".6"/>
          <rect x="46" y="11" width="4" height="117" fill="#8a8f96"/>
          <rect class="door-glow" id="doorGlow" x="8" y="11" width="80" height="117" rx="5" fill="#f44336" opacity="0"/>
          ${this._controlPanelSvg(12.5, 61)}
          <rect x="41.5" y="28" width="2.6" height="80" rx="1.3" fill="#8f949b"/>
          <rect x="51.9" y="28" width="2.6" height="80" rx="1.3" fill="#8f949b"/>
          <rect x="8" y="133" width="80" height="32" rx="5" fill="url(#frDoor)" stroke="#9aa0a6" stroke-width=".6"/>
          <rect class="drawer-glow" id="drawerGlow" x="8" y="133" width="80" height="32" rx="5" fill="#4fc3f7" opacity="0"/>
          <rect x="30" y="141" width="36" height="4" rx="2" fill="#8f949b"/>
        `;
    }

    // Side-by-Side
    _sideBySideMarkup() {
        return `
          <rect x="8" y="11" width="36" height="155" rx="5" fill="url(#frDoor)" stroke="#9aa0a6" stroke-width=".6"/>
          <rect x="52" y="11" width="36" height="155" rx="5" fill="url(#frDoor)" stroke="#9aa0a6" stroke-width=".6"/>
          <rect x="46" y="11" width="4" height="155" fill="#8a8f96"/>
          <rect class="door-glow" id="doorGlow" x="8" y="11" width="80" height="155" rx="5" fill="#f44336" opacity="0"/>
          <rect class="drawer-glow" id="drawerGlow" x="8" y="11" width="36" height="155" rx="5" fill="#4fc3f7" opacity="0"/>
          ${this._controlPanelSvg(12.5, 71)}
          <rect x="41.5" y="36" width="2.6" height="105" rx="1.3" fill="#8f949b"/>
          <rect x="51.9" y="36" width="2.6" height="105" rx="1.3" fill="#8f949b"/>
        `;
    }

    // Bottom Freezer
    _bottomFreezerMarkup() {
        return `
          <rect x="8" y="11" width="80" height="100" rx="5" fill="url(#frDoor)" stroke="#9aa0a6" stroke-width=".6"/>
          <rect class="door-glow" id="doorGlow" x="8" y="11" width="80" height="100" rx="5" fill="#f44336" opacity="0"/>
          <rect x="14" y="21" width="2.6" height="80" rx="1.3" fill="#8f949b"/>
          <rect x="8" y="115" width="80" height="50" rx="5" fill="url(#frDoor)" stroke="#9aa0a6" stroke-width=".6"/>
          <rect class="drawer-glow" id="drawerGlow" x="8" y="115" width="80" height="50" rx="5" fill="#4fc3f7" opacity="0"/>
          <rect x="30" y="120" width="36" height="4" rx="2" fill="#8f949b"/>
        `;
    }

    // Top Freezer
    _topFreezerMarkup() {
        return `
          <rect x="8" y="11" width="80" height="50" rx="5" fill="url(#frDoor)" stroke="#9aa0a6" stroke-width=".6"/>
          <rect x="8" y="65" width="80" height="100" rx="5" fill="url(#frDoor)" stroke="#9aa0a6" stroke-width=".6"/>
          <rect class="door-glow" id="doorGlow" x="8" y="11" width="80" height="154" rx="5" fill="#f44336" opacity="0"/>
          <rect class="drawer-glow" id="drawerGlow" x="8" y="11" width="80" height="50" rx="5" fill="#4fc3f7" opacity="0"/>
          <rect x="14" y="19" width="2.6" height="34" rx="1.3" fill="#8f949b"/>
          <rect x="14" y="75" width="2.6" height="80" rx="1.3" fill="#8f949b"/>
        `;
    }

    _fridgeLayoutMarkup() {
        switch (this._config.fridge_layout) {
        case "side_by_side":
            return this._sideBySideMarkup();
        case "bottom_freezer":
            return this._bottomFreezerMarkup();
        case "top_freezer":
            return this._topFreezerMarkup();
        case "french_door":
        default:
            return this._frenchDoorMarkup();
        }
    }

    _fridgeSvgMarkup() {
        return `
          <svg viewBox="0 0 96 176" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" aria-label="Refrigerator illustration">
            <defs>
              <linearGradient id="frBody" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#eef0f2"/><stop offset=".5" stop-color="#ccd0d4"/><stop offset="1" stop-color="#9da2a9"/>
              </linearGradient>
              <linearGradient id="frDoor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#f6f7f8"/><stop offset="1" stop-color="#d4d7db"/>
              </linearGradient>
            </defs>
            <rect x="4" y="6" width="88" height="165" rx="8" fill="url(#frBody)" stroke="#7d818a" stroke-width="1"/>
            ${this._fridgeLayoutMarkup()}
          </svg>
        `;
    }

    _build() {
        const config = this._config;
        const text = this._t;
        const root = this.shadowRoot || this.attachShadow({
            mode: "open"
        });

        root.innerHTML = `
      <style>
        :host { display: block; }
        ha-card {
          display: block;
          overflow: hidden;
          position: relative;
          padding: 16px 16px 14px;
          color: var(--primary-text-color);
          background: var(--ha-card-background, var(--card-background-color));
          border: 1px solid var(--ha-card-border-color, var(--divider-color));
          border-radius: var(--ha-card-border-radius, 12px);
          box-shadow: var(--ha-card-box-shadow, none);
          font-family: var(--paper-font-body1_-_font-family, inherit);
        }
        .header { display: flex; align-items: center; gap: 10px; }
        .h-icon {
          display: flex; align-items: center; justify-content: center;
          width: 44px; height: 44px; flex-shrink: 0;
          border: 1px solid var(--divider-color);
          border-radius: 14px;
          background: #f4f6f8;
          box-shadow: 0 2px 6px rgba(0,0,0,.15);
        }
        .h-icon ha-icon { --mdc-icon-size: 24px; color: #0288d1; }
        .wrap.dark-mode .h-icon {
          background: var(--secondary-background-color);
          box-shadow: 0 2px 8px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.06);
        }
        .h-title {
          flex: 0 1 auto; min-width: 56px;
          overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
          color: var(--primary-text-color);
          font-size: 17.5px; font-weight: 700;
        }
        .badge {
          display: flex; align-items: center; gap: 7px; flex-shrink: 0;
          padding: 6px 11px; border-radius: 999px;
          color: var(--secondary-text-color);
          background: var(--ha-card-background, var(--card-background-color));
          font-size: 11px; font-weight: 700; letter-spacing: .7px;
          white-space: nowrap;
        }
        .badge .b-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--disabled-text-color); }
        .nodata .badge { background: rgba(128,128,128,.12); color: var(--secondary-text-color); }
        .closed .badge { background: rgba(var(--rgb-success-color,76,175,80),.16); color: var(--success-color,#4caf50); }
        .closed .badge .b-dot { background: var(--success-color,#4caf50); }
        .open .badge { background: rgba(var(--rgb-error-color,244,67,54),.14); color: var(--error-color,#f44336); }
        .open .badge .b-dot { background: var(--error-color,#f44336); animation: pulse-dot 1.6s ease-in-out infinite; }
        @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
        .h-spacer { flex: 1; }
        .h-btn {
          display: flex; align-items: center; justify-content: center;
          width: 35px; height: 35px; flex-shrink: 0;
          border: 1px solid var(--divider-color); border-radius: 12px;
          color: var(--secondary-text-color);
          background: #f4f6f8;
          cursor: pointer; transition: transform .12s ease;
        }
        .wrap.dark-mode .h-btn {
          background: var(--secondary-background-color);
        }
        .h-btn:active { transform: scale(.94); }
        .h-btn ha-icon { --mdc-icon-size: 19px; }
        .h-btn.on {
          color: #039be5; border-color: #039be5;
          background: rgba(3,155,229,.12);
        }
        .wrap.dark-mode .h-btn.on {
          background: rgba(3,155,229,.12);
        }
        .notification-banner {
          display: flex; align-items: center; gap: 8px;
          margin-top: 12px; padding: 10px 10px 10px 14px; border-radius: 14px;
          color: var(--error-color,#db4437);
          background: rgba(var(--rgb-error-color,219,68,55),.12);
          font-size: 13px; font-weight: 700; cursor: pointer;
        }
        .notification-banner ha-icon { --mdc-icon-size: 18px; flex-shrink: 0; }
        .notification-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .notification-time { font-size: 10.5px; font-weight: 600; opacity: .75; text-transform: none; letter-spacing: 0; }
        .notification-dismiss {
          display: flex; align-items: center; justify-content: center;
          width: 22px; height: 22px; flex-shrink: 0; border-radius: 8px;
          color: var(--error-color,#db4437); cursor: pointer;
        }
        .notification-dismiss:hover { background: rgba(var(--rgb-error-color,219,68,55),.18); }
        .notification-dismiss ha-icon { --mdc-icon-size: 15px; }
        .content-row { display: flex; gap: 12px; margin-top: 14px; align-items: center; }
        .fridge-visual {
          display: flex; align-items: center; justify-content: center;
          width: 85px; flex-shrink: 0;
        }
        .fridge-visual svg { width: 100%; height: auto; display: block; filter: drop-shadow(0 4px 8px rgba(0,0,0,.2)); }
        .door-glow, .drawer-glow { transition: opacity .5s ease; }
        .door-glow.pulsing { animation: pulse-glow 2s ease-in-out infinite; }
        @keyframes pulse-glow { 0%,100% { opacity: .18; } 50% { opacity: .4; } }
        .zones-column {
          flex: 1 1 0; min-width: 0;
          display: flex; flex-direction: column; gap: 8px;
        }
        .zone-panel {
          flex: 0 0 auto; min-width: 0;
          text-align: center; border: 1px solid var(--divider-color);
          border-radius: 12px; overflow: hidden;
          background: #f6f8fa;
          display: flex; flex-direction: row; align-items: stretch;
        }
        .wrap.dark-mode .zone-panel {
          background: var(--secondary-background-color);
        }
        .zone-center {
          flex: 1 1 auto; min-width: 0; padding: 12px 4px;
          display: flex; flex-direction: column; justify-content: center; align-items: center;
        }
        .zone-label {
          margin-bottom: 4px; color: var(--secondary-text-color);
          font-size: 9.5px; font-weight: 800; letter-spacing: 1.1px;
        }
        .temp-value {
          min-width: 0; cursor: pointer;
          display: flex; align-items: baseline; justify-content: center; gap: 2px;
        }
        .temp-value .temp-num { color: var(--primary-text-color); font-size: 21px; font-weight: 800; line-height: 1; }
        .temp-value .temp-unit { color: var(--secondary-text-color); font-size: 11px; font-weight: 700; }
        .stepper-btn {
          display: flex; align-items: center; justify-content: center;
          width: 62px; flex-shrink: 0;
          border: none;
          color: var(--secondary-text-color);
          background: transparent;
          cursor: pointer; transition: background-color .12s ease;
        }
        .stepper-btn:active { background-color: rgba(2,136,209,.12); }
        .stepper-btn[id$="Minus"] { border-right: 1px solid var(--divider-color); }
        .stepper-btn[id$="Plus"] { border-left: 1px solid var(--divider-color); }
        .stepper-btn ha-icon { --mdc-icon-size: 30px; }
        .stepper-btn.disabled { opacity: .35; pointer-events: none; }
        .panel {
          display: grid; grid-template-columns: repeat(3,1fr);
          margin-top: 12px; padding: 12px 16px;
          border: 1px solid var(--divider-color); border-radius: 12px;
          background: #f6f8fa;
        }
        .wrap.dark-mode .panel {
          background: var(--secondary-background-color);
        }
        .info-item { min-width: 0; padding: 0 10px; border-left: 1px solid var(--divider-color); cursor: pointer; }
        .info-item:first-child { border-left: 0; padding-left: 0; }
        .info-label { color: var(--secondary-text-color); font-size: 10px; font-weight: 700; letter-spacing: .8px; }
        .info-value { margin-top: 4px; color: var(--primary-text-color); font-size: 13.5px; font-weight: 800; overflow-wrap: break-word; }
        .info-value.warn { color: var(--error-color,#f44336); }
        .content-row:has(> .fridge-visual.hidden) .temp-value .temp-num { font-size: 25px; }
        .hidden { display: none !important; }
      </style>

      <ha-card>
        <div class="wrap closed" id="wrap">
          <div class="header">
            <div class="h-icon"><ha-icon icon="mdi:fridge-outline"></ha-icon></div>
            <div class="h-title" id="name"></div>
            <div class="badge hidden" id="badge"><span class="b-dot"></span><span id="badgeText"></span></div>
            <div class="h-spacer"></div>
            <div class="h-btn hidden" id="expressBtn" title="${text.tip_express}">
              <ha-icon icon="mdi:snowflake" id="expressIcon"></ha-icon>
            </div>
          </div>

          <div class="notification-banner hidden" id="notificationBanner">
            <ha-icon icon="mdi:bell-alert"></ha-icon>
            <div class="notification-text">
              <span id="notificationText"></span>
              <span class="notification-time" id="notificationTime"></span>
            </div>
            <div class="h-spacer"></div>
            <div class="notification-dismiss" id="notificationDismiss" title="${text.tip_dismiss}">
              <ha-icon icon="mdi:close"></ha-icon>
            </div>
          </div>

          <div class="content-row">
            <div class="fridge-visual" id="fridgeVisual">
              ${this._fridgeSvgMarkup()}
            </div>
            <div class="zones-column" id="zonesColumn">
              ${this._zoneMarkup(1)}
              ${this._zoneMarkup(2)}
            </div>
          </div>

          <div class="panel hidden" id="infoPanel">
            <div class="info-item hidden" id="airFilterItem"><div class="info-label">${text.air_filter}</div><div class="info-value" id="airFilterValue">—</div></div>
            <div class="info-item hidden" id="waterFilterItem"><div class="info-label">${text.water_filter}</div><div class="info-value" id="waterFilterValue">—</div></div>
            <div class="info-item hidden" id="waterUsedItem"><div class="info-label">${text.water_used}</div><div class="info-value" id="waterUsedValue">—</div></div>
          </div>
        </div>
      </ha-card>
    `;

        this._el = (id) => root.getElementById(id);
        const moreInfo = (entityId) => () => this._moreInfo(entityId);

        this._el("notificationBanner").addEventListener("click", moreInfo(config.notification_entity));
        this._el("notificationDismiss").addEventListener("click", (event) => {
            event.stopPropagation();
            this._dismissNotification();
        });
        this._el("expressBtn").addEventListener("click", () => this._onExpressClick());
        this._el("airFilterItem").addEventListener("click", moreInfo(config.air_filter_entity));
        this._el("waterFilterItem").addEventListener("click", moreInfo(config.water_filter_entity));
        this._el("waterUsedItem").addEventListener("click", moreInfo(config.water_filter_used_entity));
        this._el("badge").addEventListener("click", moreInfo(config.door_entity));

        for (const zone of [1, 2]) {
            this._el(`zone${zone}Ring`).addEventListener("click", moreInfo(config[`zone${zone}_temp_entity`]));
            this._el(`zone${zone}Label`).textContent = config[`zone${zone}_label`] || text[`zone${zone}_label`];
            this._el(`zone${zone}Minus`).addEventListener("click", (event) => {
                event.stopPropagation();
                this._setZoneValue(zone, -1);
            });
            this._el(`zone${zone}Plus`).addEventListener("click", (event) => {
                event.stopPropagation();
                this._setZoneValue(zone, 1);
            });
        }

        const order = LgRefrigeratorCard.VISUAL_ORDER[config.fridge_visual_position] || LgRefrigeratorCard.VISUAL_ORDER.left;
        this._el("fridgeVisual").style.order = order.visual;
        this._el("zonesColumn").style.order = order.zones;
        this._el("fridgeVisual").classList.toggle("hidden", Boolean(config.hide_fridge_visual));

        this._built = true;
    }

    _zoneMarkup(zone) {
        return `
      <div class="zone-panel hidden" id="zone${zone}Panel">
        <div class="stepper-btn" id="zone${zone}Minus"><ha-icon icon="mdi:minus"></ha-icon></div>
        <div class="zone-center">
          <div class="zone-label" id="zone${zone}Label"></div>
          <div class="temp-value" id="zone${zone}Ring"><span class="temp-num" id="zone${zone}Temp">—</span><span class="temp-unit">°C</span></div>
        </div>
        <div class="stepper-btn" id="zone${zone}Plus"><ha-icon icon="mdi:plus"></ha-icon></div>
      </div>
    `;
    }

    _onExpressClick() {
        const entityId = this._config.express_mode_entity;
        if (!entityId || !this._hass)
            return;
        this._hass.callService("switch", "toggle", {
            entity_id: entityId
        });
    }

    _dismissNotification() {
        this._dismissedNotificationKey = this._currentNotificationKey;
        this._saveDismissedNotificationKey(this._currentNotificationKey);
        this._el("notificationBanner").classList.add("hidden");
    }

    _updateDisplayScreen() {
        const config = this._config;
        const zone1Entity = config.zone1_temp_entity;
        const zone2Entity = config.zone2_temp_entity;

        const displayLg = this._el("displayLg");
        const displayZone1 = this._el("displayZone1Text");
        const displayZone2 = this._el("displayZone2Text");
        if (!displayLg || !displayZone1 || !displayZone2)
            return;

        if (!zone1Entity && !zone2Entity) {
            displayLg.classList.remove("hidden");
            displayZone1.textContent = "";
            displayZone2.textContent = "";
            return;
        }

        displayLg.classList.add("hidden");

        if (zone1Entity) {
            const value = this._num(zone1Entity);
            const { step } = this._zoneBounds(1);
            const formatted = value !== null ? this._fmtNum(value, Number.isInteger(step) ? 0 : 1) : null;
            displayZone1.textContent = formatted !== null ? `${formatted}°C` : "--";
        } else {
            displayZone1.textContent = "";
        }

        if (zone2Entity) {
            const value = this._num(zone2Entity);
            const { step } = this._zoneBounds(2);
            const formatted = value !== null ? this._fmtNum(value, Number.isInteger(step) ? 0 : 1) : null;
            displayZone2.textContent = formatted !== null ? `${formatted}°C` : "--";
        } else {
            displayZone2.textContent = "";
        }
    }

    _update() {
        const config = this._config;
        const text = this._t;
        const wrap = this._el("wrap");

        wrap.classList.toggle("dark-mode", Boolean(this._hass?.themes?.darkMode));

        this._el("name").textContent = config.name || text.name;

        if (config.door_entity) {
            const doorState = this._st(config.door_entity);
            const noData = !doorState || ["unknown", "unavailable"].includes(doorState.state);
            const isOpen = !noData && String(doorState.state).toLowerCase() === "on";

            wrap.classList.toggle("open", isOpen);
            wrap.classList.toggle("closed", !isOpen && !noData);
            wrap.classList.toggle("nodata", noData);
            this._el("badge").classList.remove("hidden");
            this._el("badgeText").textContent = noData ? text.door_nodata : (isOpen ? text.door_open : text.door_closed);
            this._el("doorGlow").setAttribute("opacity", isOpen ? ".35" : "0");
            this._el("doorGlow").classList.toggle("pulsing", isOpen);
        } else {
            wrap.classList.remove("open", "nodata");
            wrap.classList.add("closed");
            this._el("badge").classList.add("hidden");
            this._el("doorGlow").setAttribute("opacity", "0");
            this._el("doorGlow").classList.remove("pulsing");
        }

        let expressOn = false;
        if (config.express_mode_entity) {
            const state = this._st(config.express_mode_entity);
            expressOn = String(state?.state ?? "").toLowerCase() === "on";
            this._el("expressBtn").classList.remove("hidden");
            this._el("expressBtn").classList.toggle("on", expressOn);
            this._el("expressBtn").title = expressOn ? text.express_on : text.express_off;
            this._el("expressIcon").setAttribute("icon", expressOn ? "mdi:snowflake" : "mdi:snowflake-off");
        } else {
            this._el("expressBtn").classList.add("hidden");
        }
        this._el("drawerGlow").setAttribute("opacity", expressOn ? ".45" : "0");

        if (config.notification_entity) {
            const state = this._st(config.notification_entity);
            const eventType = state?.attributes?.event_type;
            const value = String(eventType ?? "").toLowerCase();
            const hasNotification = Boolean(state) && eventType && !config.no_notification_states.includes(value);
            const notificationKey = hasNotification ? `${state.state}|${eventType}` : null;

            this._currentNotificationKey = notificationKey;
            const isDismissed = notificationKey !== null && notificationKey === this._dismissedNotificationKey;

            this._el("notificationBanner").classList.toggle("hidden", !hasNotification || isDismissed);
            if (hasNotification && !isDismissed) {
                this._el("notificationText").textContent = `${text.notification_title}: ${this._formatEventType(eventType)}`;
                const relative = this._relativeTime(state.state);
                this._el("notificationTime").textContent = relative || "";
            }
        } else {
            this._el("notificationBanner").classList.add("hidden");
        }

        this._updateZone(1);
        this._updateZone(2);
        this._updateDisplayScreen();

        let anyInfo = false;
        if (config.air_filter_entity) {
            const state = this._st(config.air_filter_entity);
            const raw = String(state?.state ?? "").toLowerCase();
            const hasWarning = raw.includes("replace") || raw.includes("change");
            this._el("airFilterItem").classList.remove("hidden");
            this._el("airFilterValue").textContent = state && !LgRefrigeratorCard.NO_FILTER_STATES.includes(raw) ? state.state : "N/A";
            this._el("airFilterValue").classList.toggle("warn", hasWarning);
            anyInfo = true;
        } else
            this._el("airFilterItem").classList.add("hidden");

        if (config.water_filter_entity) {
            const state = this._st(config.water_filter_entity);
            const raw = String(state?.state ?? "").toLowerCase();
            const hasWarning = raw.includes("replace") || raw.includes("change");
            this._el("waterFilterItem").classList.remove("hidden");
            this._el("waterFilterValue").textContent = state && !LgRefrigeratorCard.NO_FILTER_STATES.includes(raw) ? state.state : "N/A";
            this._el("waterFilterValue").classList.toggle("warn", hasWarning);
            anyInfo = true;
        } else
            this._el("waterFilterItem").classList.add("hidden");

        if (config.water_filter_used_entity) {
            const value = this._num(config.water_filter_used_entity);
            this._el("waterUsedItem").classList.remove("hidden");
            this._el("waterUsedValue").textContent = value !== null ? `${this._fmtNum(value, 1)} m³` : "N/A";
            anyInfo = true;
        } else
            this._el("waterUsedItem").classList.add("hidden");

        this._el("infoPanel").classList.toggle("hidden", !anyInfo);
    }

    _updateZone(zone) {
        const config = this._config;
        const tempEntity = config[`zone${zone}_temp_entity`];
        const panel = this._el(`zone${zone}Panel`);

        if (!tempEntity) {
            panel.classList.add("hidden");
            return;
        }

        panel.classList.remove("hidden");
        const value = this._num(tempEntity);
        const { min, max, step } = this._zoneBounds(zone);

        this._el(`zone${zone}Temp`).textContent = value !== null ? this._fmtNum(value, Number.isInteger(step) ? 0 : 1) : "N/A";

        this._el(`zone${zone}Minus`).classList.toggle("disabled", value === null || value <= min);
        this._el(`zone${zone}Plus`).classList.toggle("disabled", value === null || value >= max);
    }
}

class LgRefrigeratorCardEditor extends HTMLElement {
    static SELECT_OPTIONS = {
        fridge_layout: [{
                value: "french_door",
                label: "French Door"
            }, {
                value: "side_by_side",
                label: "Side-by-Side"
            }, {
                value: "bottom_freezer",
                label: "Bottom Freezer"
            }, {
                value: "top_freezer",
                label: "Top Freezer"
            },
        ],
        fridge_visual_position: [{
                value: "left",
                label: "Left"
            }, {
                value: "right",
                label: "Right"
            },
        ],
    };

    static AUTO_LANGUAGE = "auto";
    static DEFAULT_FRIDGE_LAYOUT = "french_door";
    static DEFAULT_VISUAL_POSITION = "left";

    static SECTION_ICONS = {
        general: "mdi:cog-outline",
        zone1: "mdi:fridge-outline",
        zone2: "mdi:snowflake",
        door: "mdi:door",
        filters: "mdi:air-filter",
    };

    static PLACEHOLDER_TEXT_KEYS = {
        name: "name",
        zone1_label: "zone1_label",
        zone2_label: "zone2_label",
    };

    constructor() {
        super();
        this._rendered = false;
    }

    setConfig(config) {
        this._config = {
            ...config
        };
        if (!this._rendered) {
            this._render();
            this._rendered = true;
        }
        this._updateValues();
    }

    set hass(hass) {
        this._hass = hass;
        if (!this._rendered) {
            this._render();
            this._rendered = true;
        }
        this._updateValues();
    }

    _languageOptions() {
        const codes = Object.keys(LgRefrigeratorCard.STRINGS);
        return [{
                value: LgRefrigeratorCardEditor.AUTO_LANGUAGE,
                label: "Automatic (Home Assistant language)"
            },
            ...codes.map((code) => ({
                    value: code,
                    label: LgRefrigeratorCard.languageDisplayName(code),
                })),
        ];
    }

    _defaultStrings() {
        const strings = LgRefrigeratorCard.STRINGS;
        const configured = String(this._config?.language || "").toLowerCase();
        if (configured && strings[configured])
            return strings[configured];
        const profileLanguage = (
            this._hass?.locale?.language || this._hass?.language || "").toLowerCase();
        if (profileLanguage) {
            if (strings[profileLanguage])
                return strings[profileLanguage];
            const base = profileLanguage.split(/[-_]/)[0];
            if (strings[base])
                return strings[base];
        }
        return strings.en;
    }

    _sectionSummary(icon, title) {
        return `<summary><span class="section-title"><ha-icon icon="${icon}"></ha-icon>${title}</span></summary>`;
    }

    _render() {
        const icons = LgRefrigeratorCardEditor.SECTION_ICONS;
        this.innerHTML = `
      <style>
        .editor { display: grid; gap: 12px; padding: 8px 0; }
        details.section {
          overflow: hidden;
          background: var(--ha-card-background, var(--card-background-color));
          border: 1px solid var(--divider-color);
          border-radius: var(--ha-card-border-radius,12px);
        }
        summary {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 16px; color: var(--primary-text-color);
          font-size: 16px; font-weight: 600; cursor: pointer;
          list-style: none; user-select: none;
        }
        summary::-webkit-details-marker { display: none; }
        .section-title { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .section-title ha-icon { --mdc-icon-size: 20px; color: var(--secondary-text-color); flex-shrink: 0; }
        summary::after {
          content: ""; width: 8px; height: 8px; flex-shrink: 0;
          border-right: 2px solid var(--secondary-text-color);
          border-bottom: 2px solid var(--secondary-text-color);
          transform: rotate(45deg); transition: transform .2s ease;
        }
        details[open] summary::after { transform: rotate(225deg); }
        details[open] summary { border-bottom: 1px solid var(--divider-color); }
        .section-content { display: grid; gap: 14px; padding: 16px; }
        .grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; }
        .entity-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        label, .field { display: grid; gap: 6px; color: var(--secondary-text-color); font-size: 12px; }
        input {
          box-sizing: border-box; width: 100%; min-height: 42px; padding: 8px 10px;
          color: var(--primary-text-color);
          background: var(--ha-card-background, var(--card-background-color));
          border: 1px solid var(--divider-color); border-radius: 8px; font: inherit;
        }
        ha-entity-picker, ha-selector { display: block; width: 100%; }
        .switch-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 42px; }
        .switch-text { display: grid; gap: 3px; min-width: 0; }
        .switch-label { color: var(--primary-text-color); font-size: 14px; }
        .field-description { color: var(--secondary-text-color); font-size: 12px; line-height: 1.4; }
        ha-switch { flex-shrink: 0; }
        @media (max-width:600px) { .grid { grid-template-columns: 1fr; } }
      </style>

      <div class="editor">
        <details class="section" open>
          ${this._sectionSummary(icons.general, "General")}
          <div class="section-content"><div class="entity-grid">
            <label>Card name<input data-config="name" type="text"></label>
            <div class="field"><span>Language</span><ha-selector data-config="language"></ha-selector></div>
            <div class="field"><span>Refrigerator layout</span><ha-selector data-config="fridge_layout"></ha-selector></div>
            <div class="field"><span>Illustration position</span><ha-selector data-config="fridge_visual_position"></ha-selector></div>
            <div class="switch-row">
              <div class="switch-text"><span class="switch-label">Hide illustration</span><span class="field-description">Hide the refrigerator illustration and enlarge the temperature zones.</span></div>
              <ha-switch data-config="hide_fridge_visual"></ha-switch>
            </div>
          </div></div>
        </details>

        ${this._zoneSection(1, "Fridge", icons.zone1)}
        ${this._zoneSection(2, "Freezer", icons.zone2)}

        <details class="section">
          ${this._sectionSummary(icons.door, "Door & notifications")}
          <div class="section-content"><div class="entity-grid">
            ${this._entityPicker("door_entity", "Door entity", ["binary_sensor"])}
            ${this._entityPicker("express_mode_entity", "Express Freeze switch", ["switch"])}
            ${this._entityPicker("notification_entity", "Notification event entity", ["event"])}
          </div></div>
        </details>

        <details class="section">
          ${this._sectionSummary(icons.filters, "Filters & water usage")}
          <div class="section-content"><div class="entity-grid">
            ${this._entityPicker("air_filter_entity", "Air filter entity", ["sensor"])}
            ${this._entityPicker("water_filter_entity", "Water filter entity", ["sensor"])}
            ${this._entityPicker("water_filter_used_entity", "Water filtered (m³) entity", ["sensor"])}
          </div></div>
        </details>
      </div>
    `;

        this._initializeEntityPickers();
        this._initializeSelectFields();
        this._initializeStandardFields();
    }

    _entityPicker(key, label, domains = []) {
        return `<div class="field"><span>${label}</span><ha-entity-picker data-config="${key}" data-domains="${domains.join(',')}" allow-custom-entity></ha-entity-picker></div>`;
    }

    _zoneSection(zone, defaultTitle, icon) {
        return `
      <details class="section">
        ${this._sectionSummary(icon, defaultTitle)}
        <div class="section-content">
          <div class="entity-grid">
            <label>Label<input data-config="zone${zone}_label" type="text"></label>
            ${this._entityPicker(`zone${zone}_temp_entity`, "Target temperature entity (number)", ["number"])}
          </div>
        </div>
      </details>
    `;
    }

    _initializeEntityPickers() {
        this.querySelectorAll("ha-entity-picker[data-config]").forEach((picker) => {
            picker.hass = this._hass;
            picker.allowCustomEntity = true;
            const domains = picker.dataset.domains?.split(",").filter(Boolean);
            if (domains?.length)
                picker.includeDomains = domains;
            picker.addEventListener("value-changed", (event) => this._valueChanged(event));
        });
    }

    _initializeSelectFields() {
        this.querySelectorAll("ha-selector[data-config]").forEach((selector) => {
            const key = selector.dataset.config;
            const options = key === "language"
                 ? this._languageOptions()
                 : LgRefrigeratorCardEditor.SELECT_OPTIONS[key] || [];

            selector.hass = this._hass;
            selector.selector = {
                select: {
                    mode: "dropdown",
                    options,
                },
            };
            selector.addEventListener("value-changed", (event) => this._valueChanged(event));
        });
    }

    _initializeStandardFields() {
        this.querySelectorAll("input[data-config]").forEach((element) => {
            element.addEventListener("input", (event) => this._valueChanged(event));
        });
        this.querySelectorAll("ha-switch[data-config]").forEach((element) => {
            element.addEventListener("change", (event) => this._valueChanged(event));
        });
    }

    _updateValues() {
        if (!this._rendered || !this._config)
            return;

        this.querySelectorAll("[data-config]").forEach((element) => {
            const key = element.dataset.config;
            const value = this._config[key];

            if (element.tagName === "HA-ENTITY-PICKER") {
                element.hass = this._hass;
                element.value = value ?? "";
                return;
            }
            if (element.tagName === "HA-SELECTOR") {
                element.hass = this._hass;
                const isEmpty = value === undefined || value === null || value === "";

                if (key === "language") {
                    element.value = isEmpty ? LgRefrigeratorCardEditor.AUTO_LANGUAGE : value;
                    return;
                }

                if (key === "fridge_layout") {
                    element.value = isEmpty ? LgRefrigeratorCardEditor.DEFAULT_FRIDGE_LAYOUT : value;
                    return;
                }

                if (key === "fridge_visual_position") {
                    element.value = isEmpty ? LgRefrigeratorCardEditor.DEFAULT_VISUAL_POSITION : value;
                    return;
                }
                element.value = value ?? "";
                return;
            }
            if (element.tagName === "HA-SWITCH") {
                element.checked = value === true;
                return;
            }

            const placeholderKey = LgRefrigeratorCardEditor.PLACEHOLDER_TEXT_KEYS[key];
            if (placeholderKey)
                element.placeholder = this._defaultStrings()[placeholderKey];

            if (document.activeElement !== element)
                element.value = value ?? "";
        });
    }

    _valueChanged(event) {
        if (!this._config)
            return;
        const target = event.currentTarget;
        const key = target?.dataset?.config;
        if (!key)
            return;

        let value;
        if (target.tagName === "HA-ENTITY-PICKER" || target.tagName === "HA-SELECTOR") {
            value = event.detail?.value ?? target.value ?? "";
            if (key === "language" && value === LgRefrigeratorCardEditor.AUTO_LANGUAGE)
                value = "";
        } else if (target.tagName === "HA-SWITCH") {
            value = Boolean(target.checked);
        } else if (target.type === "number") {
            value = target.value === "" ? undefined : Number(target.value);
        } else {
            value = target.value;
        }

        const config = {
            ...this._config,
            [key]: value
        };

        if (value === "" || value === undefined)
            delete config[key];
        this._config = config;

        this.dispatchEvent(new CustomEvent("config-changed", {
                detail: {
                    config: {
                        ...this._config
                    }
                },
                bubbles: true,
                composed: true,
            }));
    }
}

if (!customElements.get("lg-refrigerator-card-editor")) {
    customElements.define("lg-refrigerator-card-editor", LgRefrigeratorCardEditor);
}
if (!customElements.get("lg-refrigerator-card")) {
    customElements.define("lg-refrigerator-card", LgRefrigeratorCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "lg-refrigerator-card")) {
    window.customCards.push({
        type: "lg-refrigerator-card",
        name: "LG Refrigerator Card",
        description: "Refrigerator card (French Door, Side-by-Side, Bottom Freezer, Top Freezer) with freezer/fridge setpoints, door status, filters and notifications",
        preview: true,
		documentationURL: "https://github.com/KroFR/lg-refrigerator-ha-card",
    });
}

console.info(`%c ❄️ LG-REFRIGERATOR-CARD %c v${CARD_VERSION} `, "color: white; background: #3d7bfa; font-weight: 700;", "color: #3d7bfa; background: white; font-weight: 700;");
