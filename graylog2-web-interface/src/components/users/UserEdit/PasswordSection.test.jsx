// @flow strict
import * as React from 'react';
import * as Immutable from 'immutable';
import { render, fireEvent, waitFor, screen } from 'wrappedTestingLibrary';
import { alice, adminUser } from 'fixtures/users';

import CurrentUserContext from 'contexts/CurrentUserContext';
import { UsersActions } from 'stores/users/UsersStore';

import PasswordSection from './PasswordSection';

const exampleUser = alice;
const currentUser = adminUser.toBuilder()
  .permissions(Immutable.List(['*']))
  .build();

jest.mock('stores/users/UsersStore', () => ({
  UsersActions: {
    changePassword: jest.fn(() => Promise.resolve()),
  },
}));

describe('<PasswordSection />', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const SimplePasswordSection = (props) => (
    <CurrentUserContext.Provider value={{ ...currentUser.toJSON() }}>
      <PasswordSection {...props} />
    </CurrentUserContext.Provider>
  );

  it('should allow password change', async () => {
    render(<SimplePasswordSection user={exampleUser} />);

    const newPasswordInput = screen.getByLabelText('New Password');
    const newPasswordRepeatInput = screen.getByLabelText('Repeat Password');
    const submitButton = screen.getByText('Change Password');

    fireEvent.change(newPasswordInput, { target: { value: 'newpassword' } });
    fireEvent.change(newPasswordRepeatInput, { target: { value: 'newpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => expect(UsersActions.changePassword).toHaveBeenCalledTimes(1));

    expect(UsersActions.changePassword).toHaveBeenCalledWith(exampleUser.id, {
      password: 'newpassword',
    });
  });

  it('should require current password when current user is changing his password', async () => {
    const newCurrentUser = currentUser.toBuilder().readOnly(false).build();
    render(<PasswordSection user={newCurrentUser} />);

    const passwordInput = screen.getByLabelText('Old Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const newPasswordRepeatInput = screen.getByLabelText('Repeat Password');
    const submitButton = screen.getByText('Change Password');

    fireEvent.change(passwordInput, { target: { value: 'oldpassword' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword' } });
    fireEvent.change(newPasswordRepeatInput, { target: { value: 'newpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => expect(UsersActions.changePassword).toHaveBeenCalledTimes(1));

    expect(UsersActions.changePassword).toHaveBeenCalledWith(newCurrentUser.id, {
      old_password: 'oldpassword',
      password: 'newpassword',
    });
  });

  it('should display warning, if password repeat does not match password', async () => {
    render(<PasswordSection user={exampleUser} />);

    const newPasswordInput = screen.getByLabelText('New Password');
    const newPasswordRepeatInput = screen.getByLabelText('Repeat Password');

    fireEvent.change(newPasswordInput, { target: { value: 'thepassword' } });
    fireEvent.change(newPasswordRepeatInput, { target: { value: 'notthepassword' } });
    fireEvent.blur(newPasswordRepeatInput);

    await waitFor(() => expect(screen.getByText('Passwords do not match')).toBeInTheDocument());
  });
});
