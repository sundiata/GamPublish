import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Mosque as PrayerIcon,
  Headphones as AudioIcon,
  Event as EventIcon,
  Person as UserIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import Sidebar from '../components/dashboard/Sidebar';
import Topbar from '../components/dashboard/Topbar';
import StatsCard from '../components/dashboard/StatsCard';

const stats = [
  {
    title: 'Total Prayers',
    value: 132,
    icon: <PrayerIcon />,
    color: '#00897b', // Teal
  },
  {
    title: 'Audio Tracks',
    value: 87,
    icon: <AudioIcon />,
    color: '#1976d2', // Blue
  },
  {
    title: 'Events Uploaded',
    value: 19,
    icon: <EventIcon />,
    color: '#3949ab', // Indigo
  },
  {
    title: 'Registered Users',
    value: 57,
    icon: <UserIcon />,
    color: '#2e7d32', // Green
  },
];

const users = [
  {
    id: 1,
    fullName: 'Aisha Jallow',
    email: 'aisha@email.com',
    role: 'Admin',
    registeredAt: '04/01/2024',
  },
  {
    id: 2,
    fullName: 'Musa Bah',
    email: 'musa@email.com',
    role: 'Viewer',
    registeredAt: '05/01/2024',
  },
  {
    id: 3,
    fullName: 'Mariama Conteh',
    email: 'mariama@email.com',
    role: 'Editor',
    registeredAt: '06/01/2024',
  },
];

const Dashboard: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f4f4' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          width: { sm: `calc(100% - 240px)` },
          ml: { sm: `240px` },
        }}
      >
        <Topbar title="Dashboard" />
        <Box sx={{ mt: 8, mb: 4, maxWidth: '1200px', pl: 2 }}>
          {/* Stats Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: 2,
              mb: 4,
            }}
          >
            {stats.map((stat) => (
              <StatsCard key={stat.title} {...stat} />
            ))}
          </Box>

          {/* Users Table */}
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <TextField
                size="small"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell align="right">No.</TableCell>
                    <TableCell align="right">Full Name</TableCell>
                    <TableCell align="right">Email</TableCell>
                    <TableCell align="right">Role</TableCell>
                    <TableCell align="right">Registered At</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user, index) => (
                      <TableRow
                        key={user.id}
                        hover
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell align="right">{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell align="right">{user.fullName}</TableCell>
                        <TableCell align="right">{user.email}</TableCell>
                        <TableCell align="right">{user.role}</TableCell>
                        <TableCell align="right">{user.registeredAt}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => console.log('View user:', user.id)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ direction: 'rtl' }}
            />
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard; 