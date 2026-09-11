import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async getCategories(storeId: string) {
    return this.prisma.category.findMany({
      where: { storeId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getProducts(params: { storeId: string; categoryId?: string | null }) {
    return this.prisma.product.findMany({
      where: {
        categoryId: params.categoryId || undefined,
        isActive: true,
        // Only return products available in this store
        ...(params.storeId ? {
          OR: [
            { storeConfigs: { some: { storeId: params.storeId, isAvailable: true } } },
            { category: { storeId: params.storeId } },
          ],
        } : {}),
      },
      include: {
        sizes: true,
        category: true,
        addonSets: {
          include: {
            addonSet: {
              include: {
                addons: {
                  include: {
                    addon: true
                  },
                  orderBy: { displayOrder: 'asc' }
                }
              }
            }
          },
          orderBy: { displayOrder: 'asc' }
        }
      },
    });
  }

  async getAddOns(storeId?: string) {
    return this.prisma.addOn.findMany({
      where: { 
        isActive: true,
        ...(storeId ? { storeId } : {})
      },
      orderBy: { name: 'asc' },
    });
  }

  async getAddOnSets(storeId?: string) {
    return this.prisma.addOnSet.findMany({
      where: { 
        isActive: true,
        ...(storeId ? { storeId } : {})
      },
      include: {
        addons: {
          include: {
            addon: true
          },
          orderBy: { displayOrder: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async createCategory(data: any) {
    return this.prisma.category.create({ data });
  }

  async createProduct(data: any) {
    const { storeId, sizes, ...productData } = data;
    return this.prisma.product.create({
      data: {
        ...productData,
        basePrice: productData.basePrice !== undefined ? productData.basePrice : 0,
        storeConfigs: storeId ? {
          create: [{ storeId, price: productData.basePrice || null }]
        } : undefined,
        sizes: sizes?.length ? {
          create: sizes.map((s: any, idx: number) => ({
            name: s.name,
            code: s.code || s.name.toUpperCase().replace(/\s+/g, '_'),
            priceAdjustment: s.priceAdjustment || 0,
            sortOrder: idx,
          }))
        } : undefined,
      },
      include: { sizes: { orderBy: { sortOrder: 'asc' } }, category: true },
    });
  }

  async updateProduct(id: string, data: any) {
    const { storeId, sizes, ...productData } = data;

    // If sizes array is provided, delete existing and recreate
    if (sizes !== undefined) {
      await this.prisma.productSize.deleteMany({ where: { productId: id } });
      if (sizes.length > 0) {
        await this.prisma.productSize.createMany({
          data: sizes.map((s: any, idx: number) => ({
            productId: id,
            name: s.name,
            code: s.code || s.name.toUpperCase().replace(/\s+/g, '_'),
            priceAdjustment: s.priceAdjustment || 0,
            sortOrder: idx,
          })),
        });
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: productData,
      include: { sizes: { orderBy: { sortOrder: 'asc' } }, category: true },
    });
  }

  async deleteProduct(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
