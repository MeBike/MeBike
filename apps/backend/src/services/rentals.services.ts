import type { ObjectId } from "mongodb";

class RentalsService {
  async createRentalSession(user_id: ObjectId) {
    return "rental response";
  }
}

const rentalsService = new RentalsService();
export default rentalsService;
