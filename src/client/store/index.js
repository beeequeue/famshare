export const state = () => ({
  session: null,
  loggedIn: false,
})

export const mutations = {
  setSession(state, { session, username }) {
    state.session = session
    state.loggedIn = true
    state.username = username
  },

  setSetupPayments(state, bool) {
    state.session.user.setupPayments = bool
  },
}

export const actions = {
  nuxtServerInit({ commit }, { req }) {
    if (req.session) {
      commit('setSession', {
        session: req.session,
        username: req.username,
      })
    }
  },
}
