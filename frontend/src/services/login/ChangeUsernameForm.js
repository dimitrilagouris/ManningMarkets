import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Cookies from 'js-cookie';

import { DJANGO_API_BASE } from '../../config';
import { FormInput } from '../../components/forms/FormInput';
import { Button } from '../../components/buttons/Button';

/**
 * Form to handle updating the user's username.
 * @param {Object} props
 * @param {function(string): void} props.onUsernameChange
 * @returns {JSX.Element}
 */
function ChangeUsername({ onUsernameChange }) {
  const [newUsername, setNewUsername] = useState("");

  /** @param {React.FormEvent} e */
  const onSubmit = async (e) => {
    if (e) e.preventDefault();

    try {
      const res = await fetch(`${DJANGO_API_BASE}/change-username/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": Cookies.get("csrftoken") || '',
        },
        body: JSON.stringify({ newUsername }),
      });

      if (res.ok) {
        if (onUsernameChange) onUsernameChange(newUsername);
        setNewUsername('');
      }
    } catch (err) {
      // Intentional silence to prevent UI crashes on network failure
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ width: '100%', display: 'block' }}>
      <div style={{ marginBottom: '12px' }}>
        <FormInput
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          placeholder="Enter new username"
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
        Change Username
      </Button>
    </form>
  );
}

ChangeUsername.propTypes = {
  onUsernameChange: PropTypes.func.isRequired,
};

export default ChangeUsername;