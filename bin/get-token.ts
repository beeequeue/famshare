import superagent from 'superagent'

const getToken = async () => {
  const response = await superagent.get(
    `https://famshare.eu.ngrok.io/session/dev_token?userUuid=${
      process.argv[2]
    }`,
  )

  const cookie = response.header['set-cookie'].find((c: string) =>
    c.includes('session'),
  )!

  // eslint-disable-next-line no-console
  console.log(cookie.match(/session=(\w+);/)[1])
}

getToken()
