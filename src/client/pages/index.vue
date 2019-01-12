<template>
  <section>
    <h2>Hello! Welcome to famshare!</h2>

    <pre>{{ JSON.stringify(this.$store.state, null, 2) }}</pre>

    <payment-method :setupPayments="setupPayments" />
  </section>
</template>

<script>
import PaymentMethod from '~/components/payment-method'

export default {
  components: { PaymentMethod },
  computed: {
    setupPayments() {
      if (!this.$store.state.session) return false

      return this.$store.state.session.user.setupPayments
    },
  },
}
</script>

<style lang="scss" scoped>
section {
  padding: 25px 35px;
}
</style>
