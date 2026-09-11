# System Data Flow

This document outlines the high-level data flow within the Restaurant Management System, focusing primarily on the **Order Lifecycle**, which represents the most complex and critical data path in the application.

## Order Lifecycle Flow

The following diagram illustrates how an order moves through the various applications and backend services, from initial placement to final delivery.

```mermaid
sequenceDiagram
    autonumber
    
    actor Customer
    participant Storefront as Web Storefront / Mobile App
    participant POS as Admin POS
    participant API as NestJS API Gateway
    participant WS as WebSocket Gateway
    participant DB as PostgreSQL DB
    participant KDS as Kitchen Display (KDS)
    participant OSDU as Order Status Display
    participant Dispatch as Packing / Driver App
    
    %% Order Creation
    Customer->>Storefront: Browse Menu & Checkout
    Storefront->>API: POST /api/orders (Create Order)
    API->>DB: Validate & Save Order (Status: PENDING)
    DB-->>API: Return Order ID
    
    %% Real-time Broadcasting
    API->>WS: Broadcast `order.created`
    WS-->>POS: Update Active Orders list
    WS-->>OSDU: Display Order as "Received"
    
    %% Payment & Confirmation
    Customer->>Storefront: Complete Payment (Stripe)
    Storefront->>API: POST /api/payments
    API->>DB: Save Payment & Update Order (Status: CONFIRMED)
    API->>WS: Broadcast `order.confirmed`
    
    %% Routing to Kitchen
    WS-->>KDS: Display Order Ticket (Station Specific)
    WS-->>OSDU: Update Status to "Preparing"
    
    %% Kitchen Operations
    note over KDS: Kitchen staff prepares items
    KDS->>API: PUT /api/orders/{id}/status (Status: BAKING)
    API->>WS: Broadcast `order.updated`
    WS-->>OSDU: Update Status to "Baking"
    
    KDS->>API: PUT /api/orders/{id}/status (Status: READY)
    API->>DB: Update Order Status
    API->>WS: Broadcast `order.ready`
    WS-->>OSDU: Move to "Ready for Pickup" column
    WS-->>Dispatch: Alert Packing Station
    
    %% Packing & Dispatch
    note over Dispatch: Staff verifies items against ticket
    Dispatch->>API: PUT /api/orders/{id}/status (Status: PACKING)
    
    alt is Delivery Order
        Dispatch->>API: Assign Driver
        API->>WS: Alert Driver App
        Dispatch->>API: PUT /api/orders/{id}/status (Status: OUT_FOR_DELIVERY)
        WS-->>Storefront: Push Notification to Customer
    else is Pickup/Dine-in
        Customer->>Dispatch: Collects Food
        Dispatch->>API: PUT /api/orders/{id}/status (Status: COMPLETED)
        API->>DB: Finalize Order & Update Inventory
    end
```

## Key Data Flow Concepts

### 1. HTTP vs. WebSockets
* **HTTP/REST:** Used for all state-mutating actions (CRUD operations, creating orders, processing payments). The `NestJS API` handles validation, authorization, and database persistence.
* **WebSockets:** Used purely for **read-only reactive updates**. When an entity in the database changes via the REST API, the API triggers an event through the `WebSocket Gateway`, pushing the new state to all connected clients (POS, KDS, OSDU) instantly.

### 2. State Management & Inventory
* As the order status progresses (e.g., to `COMPLETED`), background workers (via Bull Queue) may trigger inventory depletion.
* The system looks at the `OrderItems`, maps them to a `Recipe`, and calculates the required `InventoryItems` to deduct from `currentStock`.

### 3. Kitchen Routing
* Not all items go to all screens. When an order is broadcasted to the KDS, the frontend (or backend logic) filters `OrderItems` based on their `KitchenStation` enum. 
* Pizzas go to the Pizza screen, Fries to the Fryer screen. Only the Packing/Dispatch screen sees the aggregated, complete order.
