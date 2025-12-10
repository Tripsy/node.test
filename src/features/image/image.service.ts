// import ImageEntity, {ImageEntityType} from "@/features/image/image.entity";
//
// export class ImageResolverService {
//     constructor(
//         private productRepo: Repository<ProductEntity>,
//         private categoryRepo: Repository<CategoryEntity>,
//         private brandRepo: Repository<BrandEntity>,
//     ) {}
//
//     async resolveImageOwner(image: ImageEntity) {
//         switch (image.entity_type) {
//             case 'product':
//                 return this.productRepo.findOneBy({ id: image.entity_id });
//
//             case 'category':
//                 return this.categoryRepo.findOneBy({ id: image.entity_id });
//
//             case 'brand':
//                 return this.brandRepo.findOneBy({ id: image.entity_id });
//
//             default:
//                 throw new Error(`Unknown entity type: ${image.entity_type}`);
//         }
//     }
// }
