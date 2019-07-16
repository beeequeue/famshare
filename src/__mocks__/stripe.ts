// eslint-disable-next-line import/no-default-export
export default class Stripe {
  public products = {
    create: (options: any) => options,
  }

  public plans = {
    create: (options: any) => options,
  }

  public subscriptions = {
    create: () => ({ id: 'stripe_id' }),
  }

  public customers = {
    create: () => ({ id: 'stripe_id' }),
  }
}
