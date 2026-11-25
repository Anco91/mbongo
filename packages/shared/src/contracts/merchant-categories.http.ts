import type {
  MerchantCategory,
  SetMerchantCategoryInput,
} from '../schemas/merchant-category';

export interface MerchantCategoryHttp {
  findAll(): Promise<MerchantCategory[]>;
  set(input: SetMerchantCategoryInput): Promise<MerchantCategory[]>;
}
