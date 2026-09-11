# Entity-Relationship Diagram (ERD)

Below is a high-level Entity-Relationship Diagram outlining the core data models and their relationships within the Restaurant Management System. This diagram focuses on the most critical entities (Stores, Users, Products, Orders, and Inventory) to provide a clear architectural overview.

```mermaid
erDiagram
    COMPANY {
        String id PK
        String name
        String timezone
    }
    
    STORE {
        String id PK
        String companyId FK
        String name
        String code
        Decimal taxRate
    }
    
    USER {
        String id PK
        String email
        String roleId FK
        String companyId FK
    }

    ROLE {
        String id PK
        String name
    }

    CATEGORY {
        String id PK
        String storeId FK
        String name
        String parentId FK
    }
    
    PRODUCT {
        String id PK
        String categoryId FK
        String name
        Decimal basePrice
        String type
    }

    PRODUCT_STORE {
        String id PK
        String productId FK
        String storeId FK
        Decimal price
    }
    
    ORDER {
        String id PK
        String storeId FK
        String orderNumber
        String status
        String type
        Decimal total
    }
    
    ORDER_ITEM {
        String id PK
        String orderId FK
        String productId FK
        Int quantity
        Decimal totalPrice
        String status
    }
    
    PAYMENT {
        String id PK
        String orderId FK
        Decimal amount
        String method
        String status
    }

    DELIVERY {
        String id PK
        String orderId FK
        String driverId FK
        String status
    }
    
    DRIVER {
        String id PK
        String storeId FK
        String name
        String status
    }

    INVENTORY_ITEM {
        String id PK
        String storeId FK
        String name
        Decimal currentStock
    }
    
    RECIPE {
        String id PK
        String productId FK
    }
    
    RECIPE_INGREDIENT {
        String id PK
        String recipeId FK
        String inventoryItemId FK
        Decimal quantity
    }

    %% Relationships
    COMPANY ||--|{ STORE : "has many"
    COMPANY ||--|{ USER : "has many"
    
    USER }|--|| ROLE : "assigned to"
    
    STORE ||--|{ CATEGORY : "contains"
    STORE ||--|{ PRODUCT_STORE : "prices"
    STORE ||--|{ ORDER : "receives"
    STORE ||--|{ DRIVER : "employs"
    STORE ||--|{ INVENTORY_ITEM : "tracks"
    
    CATEGORY ||--|{ PRODUCT : "contains"
    CATEGORY ||--o{ CATEGORY : "parent of"
    
    PRODUCT ||--|{ PRODUCT_STORE : "configured for"
    PRODUCT ||--o| RECIPE : "has"
    
    ORDER ||--|{ ORDER_ITEM : "contains"
    ORDER ||--|{ PAYMENT : "paid via"
    ORDER ||--o| DELIVERY : "fulfilled by"
    
    ORDER_ITEM }|--|| PRODUCT : "references"
    
    DELIVERY }|--|| DRIVER : "assigned to"
    
    RECIPE ||--|{ RECIPE_INGREDIENT : "requires"
    RECIPE_INGREDIENT }|--|| INVENTORY_ITEM : "consumes"
```

### Key Subsystems:

1. **Multi-Tenant Structure:** A `Company` can own multiple `Stores`. Users are scoped either to a company or specific stores via their `Role`.
2. **Menu Management:** `Categories` organize `Products`. Because prices can vary by location, `ProductStore` maps specific overrides (like price or availability) for a given `Store`.
3. **Order Flow:** An `Order` belongs to a `Store` and contains multiple `OrderItems`. It tracks financial completion via `Payments` and logistics via `Delivery` (assigned to a `Driver`).
4. **Inventory & Recipes:** A `Product` can have a `Recipe` made up of `RecipeIngredients`. These ingredients map directly to physical `InventoryItems` tracked at the `Store` level, enabling automated stock depletion.
