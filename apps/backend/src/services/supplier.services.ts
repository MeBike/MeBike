import type { Buffer } from "node:buffer";

import { v2 as cloudinary } from "cloudinary";
import { ObjectId } from "mongodb";
import process from "node:process";
import { Readable } from "node:stream";

import type { CreateSupplierReqBody } from "~/models/requests/suppliers.request";
import type { ContractType } from "~/models/schemas/contract.schema";
import type { SupplierType } from "~/models/schemas/supplier.schema";

import { ContractStatus, SupplierStatus } from "~/constants/enums";

import databaseService from "./database.services";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

function bufferToStream(buffer: Buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

class SupplierService {
  async createSupplier({ payload, image }: { payload: CreateSupplierReqBody; image: Express.Multer.File }) {
    const supplierID = new ObjectId();
    const contracts_id = new ObjectId();
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    const supplierData: SupplierType = {
      ...payload,
      _id: supplierID,
      name: payload.name,
      address: payload.address,
      phone_number: payload.phone_number,
      contracts_id: new ObjectId(contracts_id),
      status: SupplierStatus.ACTIVE,
      created_at: localTime,
    };

    const supplier_contracts: ContractType = {
      _id: contracts_id,
      supplier_id: supplierID,
      contract_fee: payload.contract_fee,
      status: ContractStatus.ACTIVE,
      start_date: payload.start_date,
      end_date: payload.end_date,
      image_url: "",
      created_at: localTime,
      updated_at: localTime,
    };

    await Promise.all([
      databaseService.suppliers.insertOne(supplierData),
      databaseService.contracts.insertOne(supplier_contracts),
    ]);

    if (image) {
      ;(async () => {
        try {
          const uploadStream = () =>
            new Promise<string>((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                {
                  resource_type: "image",
                  folder: "contracts",
                  chunk_size: 6_000_000,
                },
                (error, result) => {
                  if (error)
                    return reject(error);
                  resolve(result?.secure_url || "");
                },
              );

              bufferToStream(image.buffer).pipe(stream);
            });

          const imageUrl = await uploadStream();

          await databaseService.contracts.updateOne(
            { _id: contracts_id },
            { $set: { image_url: imageUrl, updated_at: new Date() } },
          );
        }
        catch (error) {
          console.error("Upload contract image error:", error);
        }
      })();
    }

    return { _id: supplierID };
  }

  async updateSupplier() {}
}

const supplierService = new SupplierService();
export default supplierService;
