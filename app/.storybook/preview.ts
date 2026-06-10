import type { Preview } from '@storybook/react'
import '../src/styles/fonts.css'
import '../src/styles/tokens.css'
import '../src/styles/base.css'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'surface',
      values: [
        { name: 'surface', value: '#f6f7f8' },
        { name: 'panel', value: '#eef0f1' },
        { name: 'white', value: '#ffffff' },
      ],
    },
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
  },
}

export default preview
