<template>
  <div class="connections">
    <h2>Connections</h2>

    <div class="connection">
      Google:

      <span v-if="connections.google">
        <b>{{ connections.google.identifier }}</b>
      </span>
      <button v-else @click="connectGoogle">Connect</button>
    </div>
  </div>
</template>

<script>
import { pathOr } from 'rambdax'

export default {
  computed: {
    connections() {
      return pathOr({}, 'session.user.connections', this.$store.state)
    },
  },
  methods: {
    async connectGoogle() {
      location.href = '/google/connect'
    },
  },
}
</script>

<style lang="scss" scoped>
.payment-method {
  max-width: 450px;
}
.stripe-card {
  width: 300px;
  padding: 5px;
  border-radius: 5px;
  border: 2px solid lightgrey;

  transition: border-color 0.5s;
}
.stripe-card.complete {
  border-color: green;
}
</style>
