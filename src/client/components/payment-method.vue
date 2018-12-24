<template>
  <div class="payment-method">
    <div v-if="!setupPayments">
      <h3>Please give us your payment details:</h3>

      <card
        class="stripe-card"
        :class="{ complete }"
        :stripe="stripeClientId"
        :options="stripeOptions"
        @change="complete = $event.complete"
      />

      <button class="pay-with-stripe" @click="pay" :disabled="!complete">
        Pay with credit card
      </button>
    </div>

    <div v-else>You've setup a payment method!</div>
  </div>
</template>

<script>
import superagent from 'superagent'
import { Card, createToken } from 'vue-stripe-elements-plus'

export default {
  components: { Card },
  props: {
    setupPayments: Boolean,
  },
  data() {
    return {
      stripeClientId: process.env.STRIPE_CLIENT,
      complete: false,
      stripeOptions: {
        // see https://stripe.com/docs/stripe.js#element-options for details
      },
    }
  },
  methods: {
    async pay() {
      const data = await createToken()

      if (!data.token) {
        return console.error('Did not get token back from Stripe')
      }

      superagent
        .post('/payments/register-method')
        .send({ token: data.token.id })
        .then(() => {
          this.$store.commit('setupPayments', true)
        })
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
