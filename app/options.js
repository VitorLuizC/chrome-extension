import React from 'react'
import { render } from 'react-dom'
import OptionsPage from './components/OptionsPage'
import store from './store'

store.initialization.then(() => {
  render(<OptionsPage />, document.getElementById('runrunTMApp'))
})

