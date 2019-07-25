// eslint-disable-next-line import/no-default-export
export default class Stripe {
  public products = {
    create: jest.fn(obj => obj),
  }

  public plans = {
    create: jest.fn(obj => obj),
    del: jest.fn(),
  }

  public subscriptions = {
    create: jest.fn().mockReturnValue({ id: 'stripe_id' }),
    del: jest.fn(),
  }

  public customers = {
    create: jest.fn().mockReturnValue({ id: 'stripe_id' }),
  }
}
