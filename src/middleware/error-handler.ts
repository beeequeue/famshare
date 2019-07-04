import { isBoom } from 'boom'
import { ErrorRequestHandler } from 'express'

export const ErrorHandler = (): ErrorRequestHandler => async (
  err,
  _req,
  res,
) => {
  if (process.env.NODE_ENV === 'production') {
    delete err.stack
  }

  if (isBoom(err)) {
    if (
      err.output.statusCode >= 400 &&
      err.output.statusCode < 500 &&
      err.output.statusCode !== 404
    ) {
      // eslint-disable-next-line no-console
      console.error(err.message)
    }
  } else {
    // eslint-disable-next-line no-console
    console.error(err.message)
  }

  res
    .status(err.isBoom ? err.output.statusCode : 500)
    .json(
      err.isBoom
        ? { ...err.output.payload, stack: err.stack, info: err.info }
        : err,
    )
}
