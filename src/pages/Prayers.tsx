import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import Sidebar from '../components/dashboard/Sidebar';
import Topbar from '../components/dashboard/Topbar';
import { prayerService, Prayer, CreatePrayerData } from '../services/prayerService';

const categories = ['Fajr', 'Duha', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Jumu\'ah'];

const Prayers: React.FC = () => {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [formData, setFormData] = useState<Partial<Prayer>>({
    title: '',
    date: '',
    time: '',
    category: 'Fajr',
    status: 'Draft',
    description: '',
  });

  useEffect(() => {
    loadPrayers();
  }, []);

  const loadPrayers = async () => {
    try {
      setLoading(true);
      const data = await prayerService.getAllPrayers();
      setPrayers(data);
      setError(null);
    } catch (err) {
      setError('Failed to load prayers');
      console.error('Error loading prayers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (prayer?: Prayer) => {
    if (prayer) {
      setFormData(prayer);
      setSelectedPrayer(prayer);
    } else {
      setFormData({
        title: '',
        date: '',
        time: '',
        category: 'Fajr',
        status: 'Draft',
        description: '',
      });
      setSelectedPrayer(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPrayer(null);
  };

  const handleDeleteClick = (prayer: Prayer) => {
    setSelectedPrayer(prayer);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedPrayer) {
      try {
        await prayerService.deletePrayer(selectedPrayer._id);
        setDeleteDialog(false);
        setSelectedPrayer(null);
        loadPrayers();
      } catch (err) {
        setError('Failed to delete prayer');
        console.error('Error deleting prayer:', err);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (selectedPrayer) {
        await prayerService.updatePrayer(selectedPrayer._id, formData);
      } else {
        await prayerService.createPrayer(formData as CreatePrayerData);
      }
      handleCloseDialog();
      loadPrayers();
    } catch (err) {
      setError('Failed to save prayer');
      console.error('Error saving prayer:', err);
    }
  };

  if (loading) {
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
          <Topbar title="Prayers" />
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </Box>
      </Box>
    );
  }

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
        <Topbar title="Prayers" />
        <Box sx={{ mt: 8, mb: 4, maxWidth: '1200px', pl: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" component="h2">
              Prayer List
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add New Prayer
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prayers.map((prayer) => (
                    <TableRow
                      key={prayer._id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>{prayer.title}</TableCell>
                      <TableCell>{new Date(prayer.date).toLocaleDateString()}</TableCell>
                      <TableCell>{prayer.time}</TableCell>
                      <TableCell>{prayer.category}</TableCell>
                      <TableCell>
                        <Chip
                          label={prayer.status}
                          color={prayer.status === 'Published' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(prayer)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(prayer)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Box>

      {/* Add/Edit Prayer Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedPrayer ? 'Edit Prayer' : 'Add New Prayer'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Title"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              label="Date"
              type="date"
              fullWidth
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Time"
              type="time"
              fullWidth
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                label="Category"
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Published' | 'Draft' })}
              >
                <MenuItem value="Published">Published</MenuItem>
                <MenuItem value="Draft">Draft</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedPrayer ? 'Save Changes' : 'Add Prayer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this prayer?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Prayers; 