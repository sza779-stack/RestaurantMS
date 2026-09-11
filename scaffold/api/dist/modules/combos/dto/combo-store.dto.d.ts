export declare class ComboStoreDto {
    storeId: string;
    price?: string;
    isAvailable?: boolean;
    availableFrom?: string;
    availableTo?: string;
}
export declare class UpdateComboStoresDto {
    stores: ComboStoreDto[];
}
