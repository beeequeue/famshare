import { omit } from 'rambdax'

export const state = () => ({
  session: null,
  loggedIn: false,
  identifier: null,
  user: null,
})

export const mutations = {
  setState(state, { session, loggedIn, identifier, user }) {
    state.session = {
      ...omit('user', session),
      user,
    }
    state.loggedIn = loggedIn
    state.identifier = identifier
  },

  setSetupPayments(state, bool) {
    state.session.user.setupPayments = bool
  },
}

export const actions = {
  async nuxtServerInit({ commit }, { req }) {
    if (req.session) {
      const session = await req.session.toSessionJSON()

      commit('setState', {
        session: session,
        isLoggedIn: true,
        identifier: req.identifier,
        user: session.user,
      })
    }
  },
}
