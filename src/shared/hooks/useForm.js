import { useState } from 'react';

export default function useForm(initialValues = {}) {
  const [values, setValues] = useState(initialValues);
  const handleChange = ({ target: { name, value } }) => setValues((current) => ({ ...current, [name]: value }));
  const reset = () => setValues(initialValues);
  return { values, setValues, handleChange, reset };
}
