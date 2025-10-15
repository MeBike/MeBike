import { NextFunction, Request, Response } from "express";
import reservationsService from "~/services/reservations.services";

export async function getReservationListController(req:Request, res: Response, next: NextFunction) {
    return await reservationsService.getAll()
}