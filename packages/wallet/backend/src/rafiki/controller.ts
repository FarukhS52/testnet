import { NextFunction, Request, Response } from 'express'
import { Logger } from 'winston'
import { RatesResponse, RatesService } from '@/rates/service'
import { validate } from '@/shared/validate'
import { RafikiService } from './service'
import { ratesSchema, webhookSchema } from './validation'

interface IRafikiController {
  getRates: (
    req: Request,
    res: Response<RatesResponse>,
    next: NextFunction
  ) => Promise<void>
}
interface RafikiControllerDependencies {
  logger: Logger
  rafikiService: RafikiService
  ratesService: RatesService
}

export class RafikiController implements IRafikiController {
  constructor(private deps: RafikiControllerDependencies) {}

  getRates = async (
    req: Request,
    res: Response<RatesResponse>,
    next: NextFunction
  ) => {
    try {
      const {
        query: { base }
      } = await validate(ratesSchema, req)
      const rates = await this.deps.ratesService.getRates(base)
      res.status(200).json(rates)
    } catch (e) {
      next(e)
    }
  }

  onWebHook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const wh = await validate(webhookSchema, req)

      await this.deps.rafikiService.onWebHook(wh.body)
      res.status(200).send()
    } catch (e) {
      this.deps.logger.error(
        `Webhook response error for rafiki: ${(e as Error).message}`
      )
      next(e)
    }
  }
}
