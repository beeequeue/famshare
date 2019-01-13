<template>
  <section>
    <h2>Hello! Welcome to famshare!</h2>

    <pre>{{ JSON.stringify(this.$store.state, null, 2) }}</pre>

    <connections />

    <payment-method />
  </section>
</template>

<script>
import Connections from '~/components/connections'
import PaymentMethod from '~/components/payment-method'

export default {
  components: { Connections, PaymentMethod },
}
</script>

<style lang="scss" scoped>
section {
  padding: 25px 35px;
}
</style>
