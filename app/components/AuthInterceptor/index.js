import axios from 'axios'
import store from '../../store'

const AuthInterceptor = axios.create()
AuthInterceptor.interceptors.request.use((config) => {
  config.headers['App-Key'] = store.state.appkey
  config.headers['User-Token'] = store.state.usertoken

  return config
})

export default AuthInterceptor
