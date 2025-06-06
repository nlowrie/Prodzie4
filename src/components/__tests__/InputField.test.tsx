import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InputField from '../InputField';

describe('InputField', () => {
  it('renders with label and input', () => {
    render(<InputField label="Test Label" id="test" />);
    
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });

  it('shows error message when provided', () => {
    const errorMessage = 'This field is required';
    render(<InputField label="Test Label\" id="test\" error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('applies error styles when error is present', () => {
    render(<InputField label="Test Label" id="test" error="Error" />);
    
    const input = screen.getByLabelText('Test Label');
    expect(input).toHaveClass('border-red-500');
  });

  it('calls onChange handler when input changes', () => {
    const handleChange = jest.fn();
    render(<InputField label="Test Label\" id="test\" onChange={handleChange} />);
    
    const input = screen.getByLabelText('Test Label');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('passes through additional props to input element', () => {
    render(
      <InputField
        label="Test Label"
        id="test"
        placeholder="Enter value"
        maxLength={10}
      />
    );
    
    const input = screen.getByLabelText('Test Label');
    expect(input).toHaveAttribute('placeholder', 'Enter value');
    expect(input).toHaveAttribute('maxLength', '10');
  });
});