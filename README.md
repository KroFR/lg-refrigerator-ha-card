[![HACS Custom](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://hacs.xyz/)
[![GitHub Release](https://img.shields.io/github/v/release/KroFR/lg-refrigerator-ha-card)](https://github.com/KroFR/lg-refrigerator-ha-card/releases)
[![Static Badge](https://img.shields.io/badge/Home_Assistant-2024.1+-blue)](https://www.home-assistant.io/)
[![HACS Validation](https://github.com/KroFR/lg-refrigerator-ha-card/actions/workflows/hacs.yaml/badge.svg)](https://github.com/KroFR/lg-refrigerator-ha-card/actions/workflows/hacs.yaml)
[![License](https://img.shields.io/github/license/KroFR/lg-refrigerator-ha-card)](https://github.com/KroFR/lg-refrigerator-ha-card/blob/main/LICENSE)



# ❄️ LG Refrigerator Card

A custom [Home Assistant](https://www.home-assistant.io/) Lovelace card for LG ThinQ refrigerators (French Door, Side-by-Side, Bottom Freezer, Top Freezer). It displays fridge and freezer temperature setpoints, door status, Express Freeze mode, air/water filter status, water usage, and dismissible notifications, all in a compact, mobile-friendly layout.

| Light Theme | Dark Theme |
|---|---|
| <img width="500" height="328" alt="image" src="https://github.com/user-attachments/assets/29878f92-ebb7-4245-9dbb-c797ca04978b" /> | <img width="500" height="328" alt="image" src="https://github.com/user-attachments/assets/29954897-2325-4203-a20f-719e4df518ec" /> |

## ✨ Features

- **Two independent temperature zones** (fridge and freezer) with +/- stepper controls that respect each entity's own min/max/step attributes.
- **Door status indicator** with a live pulsing badge when the door is open.
- **Express Freeze toggle** with visual on/off state.
- **Air and water filter status**, with automatic warning highlight when a filter needs replacement.
- **Water usage tracking** (in m³).
- **Dismissible notification banner** for appliance alerts. Once dismissed, the same notification won't reappear, it stays hidden until a *new* notification arrives (persisted per browser via `localStorage`).
- **Multi-language support**: English, French, Spanish, Italian, Portuguese, German, and Dutch. Automatically detects your Home Assistant profile language, or can be forced via configuration.
- **Refrigerator Layouts**: Choose your model (French Door, Side-by-Side, Bottom Freezer, or Top Freezer) directly from the visual editor, and the illustration adapts automatically, including door positions, handles, and control panel placement.
- **Configurable illustration**: show/hide the refrigerator illustration, and choose whether it appears on the left or right of the temperature zones.
- **Visual editor**: fully configurable through the Lovelace UI editor, no YAML required.

## ℹ️ Prerequisite

This card is designed to work with entities exposed by the [LG Thinq](https://www.home-assistant.io/integrations/lg_thinq) integration.

## 🧪 Model tested

- GML8031ST.ASTQGSF (French Door)

## 📦 Installation

### HACS (recommended)

1. Open **HACS** in Home Assistant.
2. Click on the three dots in the top right corner
3. Select "Custom repositories"
4. Add this repository URL `https://github.com/KroFR/lg-refrigerator-ha-card`
5. Select "Dashboard"
6. Click "Add"
7. Search for **LG Refrigerator Card** and install it

### Manual installation

1. Download `lg-refrigerator-card.js` from the `dist` folder of this repository.
2. Copy it into your Home Assistant `www/community/lg-refrigerator-ha-card/lg-refrigerator-card.js` folder.
3. Go to **Settings** > **Dashboards** > three-dot menu > **Resources**.
4. Select **Add resource**, set the URL to `/hacsfiles/lg-refrigerator-ha-card/lg-refrigerator-card.js?v=1`, and set resource type to **JavaScript module**.
5. Refresh your browser.

### Adding the card

1. Edit any dashboard and select **Add Card**.
2. Search for **LG Refrigerator Card**, or select **Manual** and use the YAML shown below.
3. Configure the entities either through the visual editor or directly in YAML.

## ⚙️ Configuration options

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `type` | string | Yes | — | Must be `custom:lg-refrigerator-card`. |
| `name` | string | No | — | Card title shown in the header. |
| `language` | string | No | — | Force a specific language. One of `en`, `fr`, `es`, `it`, `pt`, `de`, `nl`. Leave unset to auto-detect from your Home Assistant profile. |
| `door_entity` | string (`binary_sensor`) | No | — | Entity reporting the refrigerator door state (`on` = open). |
| `express_mode_entity` | string (`switch`) | No | — | Entity controlling Express Freeze mode. |
| `notification_entity` | string (`event`) | No | — | Event entity used to surface appliance alerts/notifications. |
| `air_filter_entity` | string (`sensor`) | No | — | Air filter status sensor. |
| `water_filter_entity` | string (`sensor`) | No | — | Water filter status sensor. |
| `water_filter_used_entity` | string (`sensor`) | No | — | Sensor reporting total filtered water usage, in m³. |
| `zone1_label` | string | No | — | Label for the first temperature zone. |
| `zone1_temp_entity` | string (`number`) | No | — | Number entity controlling the fridge temperature setpoint. |
| `zone2_label` | string | No | — | Label for the second temperature zone. |
| `zone2_temp_entity` | string (`number`) | No | — | Number entity controlling the freezer temperature setpoint. |
| `fridge_layout` | string | No | `french_door` | Choose your model from `french_door`, `side_by_side`, `bottom_freezer`, or `top_freezer`. |
| `fridge_visual_position` | string | No | `left` | Position of the refrigerator illustration relative to the temperature zones. One of `left`, `right`. |
| `hide_fridge_visual` | boolean | No | `false` | Hides the refrigerator illustration entirely. |

## 📝 Usage example

### Full sensor setup
The complete configuration, with both zone temperatures, the Bottom Freezer layout to the right, air and water filter information.

| Light Theme | Dark Theme |
|---|---|
| <img width="500" height="328" alt="image" src="https://github.com/user-attachments/assets/26b62c43-6053-4068-a4cf-2c420ca8f6f9" /> | <img width="500" height="328" alt="image" src="https://github.com/user-attachments/assets/dc7c6403-fcb7-4995-b9c0-4de9609760e8" /> |

```yaml
type: custom:lg-refrigerator-card
door_entity: binary_sensor.refrigerateur_door
express_mode_entity: switch.refrigerateur_express_mode
notification_entity: event.refrigerateur_notification
air_filter_entity: sensor.refrigerateur_fresh_air_filter
water_filter_entity: sensor.refrigerateur_water_filter
water_filter_used_entity: sensor.refrigerateur_water_filter_used
zone1_temp_entity: number.refrigerateur_fridge_temperature
zone2_temp_entity: number.refrigerateur_freezer_temperature
fridge_visual_position: right
hide_fridge_visual: false
fridge_layout: bottom_freezer
```

### Compact layout without illustration
Minimal example (temperature zones only, illustration hidden) with forced language.

| Light Theme | Dark Theme |
|---|---|
| <img width="500" height="245" alt="image" src="https://github.com/user-attachments/assets/4d2c6f0c-2688-4a4b-a83a-bc3d91e9420a" /> | <img width="500" height="245" alt="image" src="https://github.com/user-attachments/assets/f14f00a0-947f-42a6-98cf-bfb05bf077e4" /> |

```yaml
type: custom:lg-refrigerator-card
zone1_temp_entity: number.refrigerateur_fridge_temperature
zone2_temp_entity: number.refrigerateur_freezer_temperature
hide_fridge_visual: true
language: fr

```

## 📄 License

[<img width="78" height="20" alt="image" src="https://github.com/user-attachments/assets/c14c93d7-50c2-4726-9a47-77f6c466e5b5" />](https://github.com/KroFR/lg-refrigerator-ha-card/blob/main/LICENSE)
