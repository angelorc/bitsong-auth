export default defineEventHandler((event) => {
  handleCors(event, {
    origin: ['http://localhost:3001', 'https://demo-auth.bitsong.io'],
    methods: '*',
    credentials: true,
    preflight: {
      statusCode: 204,
    },
  })
})
