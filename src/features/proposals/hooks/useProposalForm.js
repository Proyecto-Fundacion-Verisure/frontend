import { useCallback, useRef, useState } from 'react';
import { createProposal } from '../api/proposalsApi';
import { getLineByValue } from '../../../shared/domain/activityLines';
import useForm from '../../../shared/hooks/useForm';
import {
  PROPOSAL_FIELD_ORDER,
  PROPOSAL_INITIAL_VALUES,
  buildProposalPayload,
  createTouchedFields,
  getProposalFieldError,
  getServerFieldErrors,
  validateProposal,
} from '../model/proposalForm';

function readFieldValue(event) {
  const { value, checked, type } = event.target;
  return type === 'checkbox' ? checked : value;
}

export default function useProposalForm() {
  const { values, setValues, handleChange, reset } = useForm(PROPOSAL_INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState('idle');
  const fieldRefs = useRef({});

  const setFieldRef = useCallback((name, node) => {
    if (node) {
      fieldRefs.current[name] = node;
      return;
    }
    delete fieldRefs.current[name];
  }, []);

  // El foco se mueve después del render, cuando el campo ya pinta `aria-invalid`.
  const focusFirstInvalid = useCallback((fieldErrors) => {
    const firstInvalidField = PROPOSAL_FIELD_ORDER.find((name) => fieldErrors[name]);
    if (!firstInvalidField) return;

    requestAnimationFrame(() => fieldRefs.current[firstInvalidField]?.focus());
  }, []);

  const handleFieldChange = (event) => {
    const { name, type } = event.target;
    const nextValue = readFieldValue(event);

    if (type === 'checkbox') {
      setValues((current) => ({ ...current, [name]: nextValue }));
    } else {
      handleChange(event);
    }

    if (touched[name]) {
      const fieldError = getProposalFieldError(name, { ...values, [name]: nextValue });
      setErrors((current) => ({ ...current, [name]: fieldError }));
      return;
    }
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: undefined }));
    }
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    const nextValue = readFieldValue(event);

    setTouched((current) => ({ ...current, [name]: true }));
    const fieldError = getProposalFieldError(name, { ...values, [name]: nextValue });
    setErrors((current) => ({ ...current, [name]: fieldError }));
  };

  const resetForm = () => {
    reset();
    setStatus('idle');
    setTouched({});
    setErrors({});
  };

  const applyServerFieldErrors = (fieldErrors) => {
    setErrors(fieldErrors);
    setTouched((current) => ({ ...current, ...createTouchedFields(Object.keys(fieldErrors)) }));
    setStatus('idle');
    focusFirstInvalid(fieldErrors);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateProposal(values);
    setTouched(createTouchedFields());
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      focusFirstInvalid(nextErrors);
      return;
    }

    setStatus('loading');
    try {
      await createProposal(buildProposalPayload(values));
      setStatus('success');
      reset();
      setTouched({});
      setErrors({});
    } catch (error) {
      const serverFieldErrors = getServerFieldErrors(error);
      if (serverFieldErrors) {
        applyServerFieldErrors(serverFieldErrors);
        return;
      }
      setStatus('error');
    }
  };

  return {
    values,
    errors,
    touched,
    status,
    isSuccess: status === 'success',
    isLoading: status === 'loading',
    hasSubmitError: status === 'error',
    selectedLine: getLineByValue(values.line),
    setFieldRef,
    handleFieldChange,
    handleBlur,
    handleSubmit,
    handleResetSuccess: resetForm,
  };
}
