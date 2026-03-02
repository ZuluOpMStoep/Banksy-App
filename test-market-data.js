const axios = require('axios');

async function testPrices() {
  console.log('Testing CoinGecko API...');
  try {
    const btc = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', { timeout: 5000 });
    console.log('Bitcoin:', btc.data.bitcoin.usd);
  } catch (e) {
    console.error('CoinGecko failed:', e.message);
  }

  console.log('\nTesting Polygon.io API...');
  try {
    const gold = await axios.get('https://api.polygon.io/v1/last/forex?symbols=C:XAUUSD', { timeout: 5000 });
    console.log('Gold response:', gold.data);
  } catch (e) {
    console.error('Polygon failed:', e.message);
  }
}

testPrices();
