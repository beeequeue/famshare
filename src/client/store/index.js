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
  nuxtServerInit({ commit }, { req }) {
    if (req.session) {
      commit('setState', {
        session: req.session,
        isLoggedIn: true,
        identifier: req.identifier,
        user: {
          uuid: req.session.user.uuid,
          connections: req.session.user.connections,
          setupPayments: req.session.user.stripeId != null,
        },
      })
    }
  },
}
