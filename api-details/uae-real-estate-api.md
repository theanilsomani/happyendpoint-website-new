The **UAE Real Estate Data API** is the most comprehensive UAE property data API on RapidAPI. Access property listings, real estate agents, agencies/brokerages, and historical transaction data from the UAE's two largest platforms — **Bayut** and **PropertyFinder** — through a single, developer-friendly interface.

Whether you're building a property comparison app, a market analytics dashboard, an investment research tool, or a real estate CRM — this API gives you everything you need.

#### Last Updated: March 18, 2026

#### Real-time data

#### No proxies needed

#### Bayut + Propertyfinder Data in single endpoint

### Why Developers Choose This API

**Dead Simple Integration:** Pass a location name like "Dubai Marina" or "Business Bay" — we auto-resolve it to the right platform-specific ID and return results. No need to look up IDs, learn platform-specific schemas, or manage multiple API keys.

**10 Endpoints, Two Platforms:** Get data from both Bayut and PropertyFinder through the same endpoint structure. Switch platforms with a single parameter change.

**Rich Property Data:** Full listing details including price, bedrooms, bathrooms, area, photos, agent info, amenities, completion status, floor plans, and more.

**Agent & Agency Intelligence:** Search for real estate agents by name or location. Find agencies and brokerages. View their active property listings — perfect for building agent directories or lead generation tools.

**Market Transactions:** Access historical sales and rental transaction data. Filter by property type, bedrooms, time period, and location. Essential for property valuation, market analysis, and investment research.

**Built for Production:** Clean JSON responses, consistent error handling, pagination support, and detailed OpenAPI documentation.

---

### Endpoints

#### Property Endpoints

| Endpoint                 | Description                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `GET /autocomplete`      | Location search with auto-complete. Returns location IDs with coordinates.                                      |
| `GET /search-properties` | Search properties for rent or sale. 15+ filters including bedrooms, price, area, furnishing, completion status. |
| `GET /property-details`  | Full property details — photos, description, amenities, agent info, floor plans, off-plan details.              |

#### Agent Endpoints

| Endpoint                | Description                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `GET /search-agents`    | Find real estate agents by name (Bayut) or location (both platforms). Filter by purpose (sale/rent) and category. |
| `GET /agent-details`    | Detailed agent profile with contact info, service areas, listings stats, badges. (Bayut)                          |
| `GET /agent-properties` | All properties listed by a specific agent. Supports pagination and sorting.                                       |

#### Agency / Broker Endpoints

| Endpoint                 | Description                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `GET /search-agencies`   | Search real estate agencies (Bayut) or brokerages (PropertyFinder) by name or location. |
| `GET /agency-details`    | Full agency/broker profile with agent count, listing stats, contact info. (Bayut)       |
| `GET /agency-properties` | All properties listed by a specific agency or brokerage.                                |

#### Transaction Endpoints

| Endpoint                | Description                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `GET /get-transactions` | Historical property transaction data (sales & rentals). Filter by property type, bedrooms, time period, sort order. |

---

### Quick Start Examples

**Search apartments for rent in Dubai Marina:**

```
GET /search-properties?platform=bayut&purpose=rent&location=Dubai Marina&property_type=apartment
```

**Search villas for sale in Palm Jumeirah:**

```
GET /search-properties?platform=propertyfinder&purpose=buy&location=Palm Jumeirah&property_type=villa&sort=price_low
```

**Find agents in Business Bay:**

```
GET /search-agents?platform=propertyfinder&location=Business Bay&purpose=buy
```

**Search agencies by name:**

```
GET /search-agencies?platform=bayut&query=DAMAC
```

**Get transaction history for Dubai Marina sales:**

```
GET /get-transactions?platform=bayut&transaction_type=sale&location=Dubai Marina&time_period=1y&sort=newest
```

**Autocomplete a location (with coordinates):**

```
GET /autocomplete?platform=bayut&query=JBR
```

---

### Property Search Filters

| Filter                    | Description                                                                      | Example              |
| ------------------------- | -------------------------------------------------------------------------------- | -------------------- |
| `property_type`           | Apartment, villa, townhouse, penthouse, office, shop, warehouse, hotel-apartment | `apartment,villa`    |
| `bedrooms`                | Number of bedrooms (0 = studio)                                                  | `0,1,2,3`            |
| `bathrooms`               | Number of bathrooms                                                              | `1,2`                |
| `price_min` / `price_max` | Price range in AED                                                               | `50000` / `200000`   |
| `area_min` / `area_max`   | Area in sqft                                                                     | `500` / `2000`       |
| `furnishing`              | Furnished or unfurnished                                                         | `furnished`          |
| `completion_status`       | Ready to move in or off-plan                                                     | `ready` / `off_plan` |
| `rent_frequency`          | Yearly, monthly, weekly, daily                                                   | `yearly`             |
| `sort`                    | Popular, newest, price low/high                                                  | `price_low`          |

### Transaction Filters

| Filter             | Description                    | Example                |
| ------------------ | ------------------------------ | ---------------------- |
| `transaction_type` | Sales or rentals               | `sale` / `rental`      |
| `property_type`    | Same as property search        | `apartment`            |
| `bedrooms`         | Bedroom count                  | `2`                    |
| `time_period`      | Historical window              | `3m`, `6m`, `1y`, `2y` |
| `sort`             | Newest, oldest, price high/low | `newest`               |

---

### Coverage

**All UAE Emirates:** Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain

**Popular Areas:** Dubai Marina, Downtown Dubai, Palm Jumeirah, JBR, Business Bay, JLT, Arabian Ranches, DIFC, Al Reem Island, Yas Island, Saadiyat Island, and thousands more.

### Data Sources

| Platform           | Website           | Coverage                                               |
| ------------------ | ----------------- | ------------------------------------------------------ |
| **Bayut**          | bayut.com         | UAE's leading property portal — 200,000+ listings      |
| **PropertyFinder** | propertyfinder.ae | UAE's largest property marketplace — 250,000+ listings |

---

### Use Cases

- **Property Comparison Apps** — Search across both platforms, compare listings side by side
- **Real Estate Analytics Dashboards** — Historical transaction data, price trends by location
- **Investment Research Tools** — Market data, transaction history, property valuations
- **Agent & Agency Directories** — Build searchable databases of real estate professionals
- **Lead Generation Platforms** — Find active agents and their listings in specific areas
- **ChatBots & AI Assistants** — Natural language property search powered by structured data
- **Market Reports** — Automated reporting on UAE real estate market activity
- **Property Management Systems** — Track listings, agents, and market conditions

---

## Example API Responses

### Autocomplete

**Request:** `GET /autocomplete?platform=bayut&query=Dubai Marina`

```json
{
  "success": true,
  "platform": "bayut",
  "data": [
    {
      "location_id": "5003",
      "name": "Dubai Marina",
      "type": "neighbourhood",
      "path": "UAE > Dubai > Dubai Marina",
      "coordinates": { "lat": 25.0831, "lon": 55.1443 }
    }
  ]
}
```

### Search Properties

**Request:** `GET /search-properties?platform=bayut&purpose=rent&location=Dubai Marina&bedrooms=1,2&price_max=100000`

```json
{
  "success": true,
  "platform": "bayut",
  "data": {
    "properties": [
      {
        "id": "10935141",
        "externalID": "14354275",
        "title": { "en": "Stunning Marina View | 1 Bedroom Unfurnished" },
        "purpose": "for-rent",
        "price": 85000,
        "rentFrequency": "yearly",
        "rooms": 1,
        "baths": 2,
        "area": 64.27,
        "isVerified": true,
        "completionStatus": "completed",
        "amenities": ["Parking", "Swimming Pool", "Gym", "Security"],
        "...": " full property data"
      }
    ],
    "total": 1432,
    "page": 1,
    "totalPages": 58,
    "hitsPerPage": 25
  }
}
```

### Search Agents

**Request:** `GET /search-agents?platform=bayut&query=Ahmed`

```json
{
  "success": true,
  "platform": "bayut",
  "data": {
    "agents": [
      {
        "externalID": "474947",
        "name": "Ahmed Hassan",
        "agency": { "name": "Luxury Living Real Estate" },
        "sale_count": 45,
        "rent_count": 120,
        "isTruBroker": true
      }
    ],
    "total": 1015,
    "page": 1,
    "totalPages": 51,
    "hitsPerPage": 20
  }
}
```

### Search Agencies / Brokers

**Request:** `GET /search-agencies?platform=bayut&query=DAMAC`

```json
{
  "success": true,
  "platform": "bayut",
  "data": {
    "agencies": [
      {
        "externalID": "10212",
        "name": "DAMAC Properties",
        "stats": { "adsCount": 5210 },
        "agentsCount": 45
      }
    ],
    "total": 7,
    "page": 1
  }
}
```

### Get Transactions

**Request:** `GET /get-transactions?platform=bayut&transaction_type=sale&location=Dubai Marina&time_period=1y`

```json
{
  "success": true,
  "platform": "bayut",
  "data": {
    "hits": [
      {
        "transactionDate": "2026-03-10",
        "price": 1850000,
        "area": 85.5,
        "rooms": 1,
        "propertyType": "Apartment",
        "location": "Dubai Marina"
      }
    ],
    "totalCount": 4250
  }
}
```

### Platform Limitation Error

**Request:** `GET /agent-details?platform=propertyfinder&agent_id=123`

```json
{
  "success": false,
  "message": "Agent details is not available for PropertyFinder. Use /search-agents to find agents or /agent-properties to view their listings.",
  "error": "PLATFORM_LIMITATION"
}
```
