import React from 'react'
import { render } from '@testing-library/react-native'
import { ConfigurationRequiredScreen } from './ConfigurationRequiredScreen'

describe('ConfigurationRequiredScreen', () => {
  it('renders the configuration-required message and the given reason', () => {
    const { getByText } = render(<ConfigurationRequiredScreen reason="EXPO_PUBLIC_SUPABASE_URL is not set." />)

    expect(getByText('ShareRide')).toBeTruthy()
    expect(getByText('Development configuration required')).toBeTruthy()
    expect(getByText('Supabase and/or API configuration has not been provided for this build.')).toBeTruthy()
    expect(getByText('EXPO_PUBLIC_SUPABASE_URL is not set.')).toBeTruthy()
  })
})
