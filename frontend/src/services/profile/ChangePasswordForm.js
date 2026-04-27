import React, { useState } from 'react';
import Cookies from 'js-cookie';

import { DJANGO_API_BASE } from '../../config';
import { FormInput } from '../../components/forms/FormInput';
import { Button } from '../../components/buttons/Button';

/**
 * Form to handle updating the user's password.
 * @returns {JSX.Element}
 */
function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  /** @param {React.FormEvent} e */
  const onSubmit = async (e) => {
    if (e) e.preventDefault();

    try {
      const res = await fetch(`${DJANGO_API_BASE}/change-password/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": Cookies.get("csrftoken") || '',
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      if (res.ok) {
        setOldPassword('');
        setNewPassword('');
      }
    } catch (err) {
      // Intentional silence to prevent UI crashes on network failure
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ width: '100%', display: 'block' }}>
      <div style={{ marginBottom: '12px' }}>
        <FormInput
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          placeholder="Current password"
          fullWidth={true}
        />
      </div>
      <div style={{ marginBottom: '12px' }}>
        <FormInput
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password"
          fullWidth={true}
        />
      </div>
      <Button
        fill="none"
        outline="primary"
        textColor="dark"
        width="full"
        height="medium"
        onClick={onSubmit}
      >
        Change Password
      </Button>
    </form>
  );
}

export default ChangePassword;