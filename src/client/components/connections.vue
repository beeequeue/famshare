<template>
  <div class="connections">
    <h2>Connections</h2>

    <div class="connection">
      Google:

      <button @click="connectGoogle">Connect</button>
    </div>
  </div>
</template>

<script>
export default {
  components: {},
  props: {},
  data() {
    return {}
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
