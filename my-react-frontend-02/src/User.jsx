//src/User.jsx

import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./context/UserContext";

import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { DataGrid } from "@mui/x-data-grid";

const API_URL = import.meta.env.VITE_API_URL;

export default function User() {
  const navigate = useNavigate();
  const { isAdmin } = useContext(UserContext);

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const isInit = useRef(false);

  const cols = [
    { field: "username", headerName: "Username", flex: 2 },
    { field: "email", headerName: "Email", flex: 3 },
    {
      field: "actions",
      headerName: "",
      sortable: false,
      filterable: false,
      flex: 2,
      renderCell: (params) => (
        <Button size="small" onClick={() => openDialog(params.row)}>
          Change Password
        </Button>
      ),
    },
  ];

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    if (isInit.current) return;
    isInit.current = true;
    loadUsers();
  }, [isAdmin]);

  const loadUsers = async () => {
    const result = await fetch(`${API_URL}/api/user`, {
      credentials: "include",
    });
    if (result.ok) {
      const data = await result.json();
      setUsers(data.userList);
    }
  };

  const openDialog = (user) => {
    setSelectedUser(user);
    setPassword("");
    setConfirm("");
    setErrorMsg("");
  };

  const closeDialog = () => {
    setSelectedUser(null);
  };

  const onChangePassword = async () => {
    if (password.length < 4) {
      setErrorMsg("Password must be at least 4 characters");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Passwords do not match");
      return;
    }

    const result = await fetch(
      `${API_URL}/api/user/${selectedUser._id}/password`,
      {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      },
    );

    if (result.ok) {
      setSuccessMsg(`Password changed for ${selectedUser.username}`);
      closeDialog();
    } else {
      const errData = await result.json();
      setErrorMsg(errData.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 px-1">
        <Typography variant="h6">Users</Typography>
      </div>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg("")}>
          {successMsg}
        </Alert>
      )}

      <DataGrid rows={users} columns={cols} getRowId={(row) => row._id} />

      <Dialog open={!!selectedUser} onClose={closeDialog} fullWidth>
        <DialogTitle>Change Password — {selectedUser?.username}</DialogTitle>
        <DialogContent>
          <div className="flex flex-col gap-2 pt-2">
            <TextField
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              label="Confirm Password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={onChangePassword}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
