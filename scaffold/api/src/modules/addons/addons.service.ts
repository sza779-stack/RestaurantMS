import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddOnDto, UpdateAddOnDto } from './dto/addon.dto';
import { CreateAddOnSetDto, UpdateAddOnSetDto } from './dto/addon-set.dto';
import { Prisma, ProductType } from '@prisma/client';

@Injectable()
export class AddonsService {
  constructor(private prisma: PrismaService) {}

  // --- AddOns ---
  async createAddOn(dto: CreateAddOnDto) {
    const { applicableItemTypes, ...data } = dto;
    return this.prisma.addOn.create({
      data: {
        ...data,
        price: dto.price !== undefined ? new Prisma.Decimal(dto.price) : 0,
        sizePrices: dto.sizePrices || {},
        applicableItemTypes: applicableItemTypes as ProductType[],
      },
    });
  }

  async findAllAddOns(storeId?: string) {
    return this.prisma.addOn.findMany({
      where: { 
        storeId, 
        isActive: true 
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOneAddOn(id: string) {
    const addon = await this.prisma.addOn.findUnique({
      where: { id },
      include: { 
        addonSets: {
          include: {
            set: true
          }
        } 
      },
    });
    if (!addon) throw new NotFoundException(`AddOn with ID ${id} not found`);
    return addon;
  }

  async updateAddOn(id: string, dto: UpdateAddOnDto) {
    const { applicableItemTypes, ...data } = dto;
    return this.prisma.addOn.update({
      where: { id },
      data: {
        ...data,
        price: dto.price !== undefined ? new Prisma.Decimal(dto.price) : undefined,
        sizePrices: dto.sizePrices !== undefined ? dto.sizePrices : undefined,
        applicableItemTypes: applicableItemTypes ? (applicableItemTypes as ProductType[]) : undefined,
      },
    });
  }

  async removeAddOn(id: string) {
    return this.prisma.addOn.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // --- AddOnSets ---
  async createAddOnSet(dto: CreateAddOnSetDto) {
    const { addons, applicableItemTypes, ...setData } = dto;
    return this.prisma.addOnSet.create({
      data: {
        ...setData,
        storeId: setData.storeId || '', // Handle required storeId
        applicableItemTypes: applicableItemTypes as ProductType[],
        addons: addons ? {
          create: addons.map(a => ({
            addonId: a.addonId,
            displayOrder: a.displayOrder || 0,
            priceOverride: a.priceOverride !== undefined ? new Prisma.Decimal(a.priceOverride) : null,
          })),
        } : undefined,
      },
      include: { 
        addons: { 
          include: { 
            addon: true 
          },
          orderBy: { displayOrder: 'asc' }
        } 
      },
    });
  }

  async findAllAddOnSets(storeId?: string) {
    return this.prisma.addOnSet.findMany({
      where: { 
        storeId,
        isActive: true 
      },
      include: { 
        addons: { 
          include: { 
            addon: true 
          },
          orderBy: { displayOrder: 'asc' }
        },
        products: {
          include: {
            product: {
              select: { id: true, name: true, category: { select: { id: true, name: true } } }
            }
          }
        }
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOneAddOnSet(id: string) {
    const set = await this.prisma.addOnSet.findUnique({
      where: { id },
      include: { 
        addons: { 
          include: { 
            addon: true 
          },
          orderBy: { displayOrder: 'asc' }
        } 
      },
    });
    if (!set) throw new NotFoundException(`AddOnSet with ID ${id} not found`);
    return set;
  }

  async updateAddOnSet(id: string, dto: UpdateAddOnSetDto) {
    const { addons, applicableItemTypes, ...setData } = dto;

    if (addons) {
      // Re-link addons
      await this.prisma.setAddOn.deleteMany({ where: { setId: id } });
    }

    return this.prisma.addOnSet.update({
      where: { id },
      data: {
        ...setData,
        applicableItemTypes: applicableItemTypes ? (applicableItemTypes as ProductType[]) : undefined,
        addons: addons ? {
          create: addons.map(a => ({
            addonId: a.addonId,
            displayOrder: a.displayOrder || 0,
            priceOverride: a.priceOverride !== undefined ? new Prisma.Decimal(a.priceOverride) : null,
          })),
        } : undefined,
      },
      include: { 
        addons: { 
          include: { 
            addon: true 
          },
          orderBy: { displayOrder: 'asc' }
        } 
      },
    });
  }

  async removeAddOnSet(id: string) {
    return this.prisma.addOnSet.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // --- Product-AddOnSet Linkage ---
  async linkSetToProduct(productId: string, addonSetId: string, displayOrder: number = 0) {
    return this.prisma.productAddOnSet.upsert({
      where: {
        productId_addonSetId: { productId, addonSetId }
      },
      update: { displayOrder },
      create: { productId, addonSetId, displayOrder }
    });
  }

  async unlinkSetFromProduct(productId: string, addonSetId: string) {
    return this.prisma.productAddOnSet.delete({
      where: {
        productId_addonSetId: { productId, addonSetId }
      }
    });
  }

  async getProductAddOnSets(productId: string) {
    return this.prisma.productAddOnSet.findMany({
      where: { productId },
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
    });
  }
}
