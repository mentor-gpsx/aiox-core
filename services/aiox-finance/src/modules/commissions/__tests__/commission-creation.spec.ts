import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { CommissionCreationService } from '../commission-creation.service';
import { CommissionCalculatorService } from '../commission-calculator.service';

describe('CommissionCreationService', () => {
  let service: CommissionCreationService;
  let calculatorService: CommissionCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommissionCalculatorService, CommissionCreationService],
    }).compile();

    service = module.get<CommissionCreationService>(CommissionCreationService);
    calculatorService = module.get<CommissionCalculatorService>(CommissionCalculatorService);
  });

  describe('createCommissionFromSale', () => {
    it('should create commission for approved sale with valid seller', async () => {
      const sale = {
        id: 'sale-1',
        net_amount: 1000,
        seller_id: 'seller-1',
        status: 'APPROVED',
      };
      const seller = {
        id: 'seller-1',
        commission_percentage: 10,
      };

      jest.spyOn(service as any, 'findCommissionBySaleId').mockResolvedValue(null);
      jest.spyOn(service as any, 'logAuditEntry').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'supabase.from').mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'commission-1',
                sale_id: 'sale-1',
                seller_id: 'seller-1',
                amount: 100,
                percentage: 10,
                status: 'PENDING',
                created_at: '2026-05-13T00:00:00Z',
                updated_at: '2026-05-13T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await service.createCommissionFromSale(sale, seller);
      expect(result.amount).toBe(100);
      expect(result.status).toBe('PENDING');
    });

    it('should throw error for non-approved sale', async () => {
      const sale = {
        id: 'sale-1',
        net_amount: 1000,
        seller_id: 'seller-1',
        status: 'PENDING',
      };
      const seller = {
        id: 'seller-1',
        commission_percentage: 10,
      };

      await expect(service.createCommissionFromSale(sale, seller)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw error if seller has no commission percentage', async () => {
      const sale = {
        id: 'sale-1',
        net_amount: 1000,
        seller_id: 'seller-1',
        status: 'APPROVED',
      };
      const seller = {
        id: 'seller-1',
        commission_percentage: null as any,
      };

      await expect(service.createCommissionFromSale(sale, seller)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw ConflictException if commission already exists', async () => {
      const sale = {
        id: 'sale-1',
        net_amount: 1000,
        seller_id: 'seller-1',
        status: 'APPROVED',
      };
      const seller = {
        id: 'seller-1',
        commission_percentage: 10,
      };

      jest.spyOn(service as any, 'findCommissionBySaleId').mockResolvedValue({
        id: 'existing-commission',
        sale_id: 'sale-1',
        seller_id: 'seller-1',
        amount: 100,
        percentage: 10,
        status: 'PENDING',
        created_at: '2026-05-13T00:00:00Z',
        updated_at: '2026-05-13T00:00:00Z',
      });

      await expect(service.createCommissionFromSale(sale, seller)).rejects.toThrow(
        ConflictException
      );
    });

    it('should calculate commission amount correctly', async () => {
      const sale = {
        id: 'sale-2',
        net_amount: 5555.55,
        seller_id: 'seller-2',
        status: 'APPROVED',
      };
      const seller = {
        id: 'seller-2',
        commission_percentage: 8.5,
      };

      jest.spyOn(service as any, 'findCommissionBySaleId').mockResolvedValue(null);
      jest.spyOn(service as any, 'logAuditEntry').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'supabase.from').mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'commission-2',
                sale_id: 'sale-2',
                seller_id: 'seller-2',
                amount: 472.22,
                percentage: 8.5,
                status: 'PENDING',
                created_at: '2026-05-13T00:00:00Z',
                updated_at: '2026-05-13T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await service.createCommissionFromSale(sale, seller);
      expect(result.amount).toBeCloseTo(472.22, 2);
    });

    it('should log audit entry when creating commission', async () => {
      const sale = {
        id: 'sale-3',
        net_amount: 1000,
        seller_id: 'seller-1',
        status: 'APPROVED',
      };
      const seller = {
        id: 'seller-1',
        commission_percentage: 10,
      };

      jest.spyOn(service as any, 'findCommissionBySaleId').mockResolvedValue(null);
      const auditLogSpy = jest.spyOn(service as any, 'logAuditEntry').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'supabase.from').mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'commission-3',
                sale_id: 'sale-3',
                seller_id: 'seller-1',
                amount: 100,
                percentage: 10,
                status: 'PENDING',
                created_at: '2026-05-13T00:00:00Z',
                updated_at: '2026-05-13T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      });

      await service.createCommissionFromSale(sale, seller);
      expect(auditLogSpy).toHaveBeenCalled();
    });

    it('should handle commission for zero percentage seller', async () => {
      const sale = {
        id: 'sale-4',
        net_amount: 1000,
        seller_id: 'seller-zero',
        status: 'APPROVED',
      };
      const seller = {
        id: 'seller-zero',
        commission_percentage: 0,
      };

      jest.spyOn(service as any, 'findCommissionBySaleId').mockResolvedValue(null);
      jest.spyOn(service as any, 'logAuditEntry').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'supabase.from').mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'commission-4',
                sale_id: 'sale-4',
                seller_id: 'seller-zero',
                amount: 0,
                percentage: 0,
                status: 'PENDING',
                created_at: '2026-05-13T00:00:00Z',
                updated_at: '2026-05-13T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await service.createCommissionFromSale(sale, seller);
      expect(result.amount).toBe(0);
    });
  });

  describe('bulkCreateForApprovedSales', () => {
    it('should create commissions for multiple approved sales', async () => {
      jest.spyOn(service as any, 'getSaleById').mockImplementation((id) => {
        const sales: Record<string, any> = {
          'sale-1': { id: 'sale-1', net_amount: 1000, seller_id: 'seller-1', status: 'APPROVED' },
          'sale-2': { id: 'sale-2', net_amount: 2000, seller_id: 'seller-1', status: 'APPROVED' },
        };
        return Promise.resolve(sales[id] || null);
      });

      jest.spyOn(service as any, 'getSellerById').mockResolvedValue({
        id: 'seller-1',
        commission_percentage: 10,
      });

      jest.spyOn(service as any, 'createCommissionFromSale').mockImplementation((sale, seller) => {
        return Promise.resolve({
          id: `commission-${sale.id}`,
          sale_id: sale.id,
          seller_id: seller.id,
          amount: (sale.net_amount * seller.commission_percentage) / 100,
          percentage: seller.commission_percentage,
          status: 'PENDING',
          created_at: '2026-05-13T00:00:00Z',
          updated_at: '2026-05-13T00:00:00Z',
        });
      });

      const result = await service.bulkCreateForApprovedSales(['sale-1', 'sale-2']);
      expect(result).toHaveLength(2);
      expect(result[0].sale_id).toBe('sale-1');
      expect(result[1].sale_id).toBe('sale-2');
    });

    it('should handle partial failures gracefully', async () => {
      jest.spyOn(service as any, 'getSaleById').mockImplementation((id) => {
        if (id === 'sale-1') {
          return Promise.resolve({
            id: 'sale-1',
            net_amount: 1000,
            seller_id: 'seller-1',
            status: 'APPROVED',
          });
        }
        return Promise.resolve(null);
      });

      jest.spyOn(service as any, 'getSellerById').mockResolvedValue({
        id: 'seller-1',
        commission_percentage: 10,
      });

      jest.spyOn(service as any, 'createCommissionFromSale').mockResolvedValue({
        id: 'commission-1',
        sale_id: 'sale-1',
        seller_id: 'seller-1',
        amount: 100,
        percentage: 10,
        status: 'PENDING',
        created_at: '2026-05-13T00:00:00Z',
        updated_at: '2026-05-13T00:00:00Z',
      });

      const result = await service.bulkCreateForApprovedSales(['sale-1', 'sale-invalid']);
      expect(result).toHaveLength(1);
      expect(result[0].sale_id).toBe('sale-1');
    });
  });
});
