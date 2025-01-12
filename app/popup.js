import React from 'react'
import { render } from 'react-dom'
import { Router, hashHistory } from 'react-router'
import routes from './routes'
import store from './store'

store.initialization.then(() => {
  const appContainer = document.getElementById('runrunTMApp')
  const path = appContainer.getAttribute('path') || ''

  render(
    <Router history={hashHistory} routes={routes(path)} />,
    appContainer
  )
})
