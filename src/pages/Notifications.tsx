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
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import Sidebar from '../components/dashboard/Sidebar';
import Topbar from '../components/dashboard/Topbar';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'alert' | 'reminder';
  sentAt: Date;
  status: 'sent' | 'scheduled';
  targetAudience: 'all' | 'group';
  groupId?: string;
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    title: 'New Lecture Drop',
    message: 'New Tafsir by Imam Fatty on Surah Al-Baqarah is now available.',
    type: 'info',
    sentAt: new Date('2024-05-01T10:00:00'),
    status: 'sent',
    targetAudience: 'all',
  },
  {
    id: 2,
    title: 'Event Reminder',
    message: "Don't miss Jumu'ah today! Prayer starts at 1:30 PM.",
    type: 'reminder',
    sentAt: new Date('2024-04-30T09:00:00'),
    status: 'scheduled',
    targetAudience: 'all',
  },
];

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [openSendDialog, setOpenSendDialog] = useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [formData, setFormData] = useState<Partial<Notification>>({
    title: '',
    message: '',
    type: 'info',
    targetAudience: 'all',
    sentAt: new Date(),
  });

  const handleOpenSendDialog = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      targetAudience: 'all',
      sentAt: new Date(),
    });
    setOpenSendDialog(true);
  };

  const handleCloseSendDialog = () => {
    setOpenSendDialog(false);
  };

  const handlePreview = () => {
    setOpenPreviewDialog(true);
  };

  const handleSend = () => {
    const newNotification: Notification = {
      ...formData as Notification,
      id: Math.max(...notifications.map(n => n.id)) + 1,
      status: formData.sentAt && formData.sentAt > new Date() ? 'scheduled' : 'sent',
    };
    setNotifications([...notifications, newNotification]);
    handleCloseSendDialog();
    setOpenPreviewDialog(false);
  };

  const handleDelete = (notification: Notification) => {
    setNotifications(notifications.filter(n => n.id !== notification.id));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <NotificationsIcon sx={{ color: 'info.main' }} />;
      case 'alert':
        return <WarningIcon sx={{ color: 'error.main' }} />;
      case 'reminder':
        return <AccessTimeIcon sx={{ color: 'warning.main' }} />;
      default:
        return <NotificationsIcon />;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

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
        <Topbar title="Notifications" />
        <Box sx={{ mt: 8, mb: 4, maxWidth: '1200px', pl: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" component="h2">
              Notifications
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => setOpenSettingsDialog(true)}
              >
                Settings
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenSendDialog}
              >
                Send Notification
              </Button>
            </Box>
          </Box>

          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Message Preview</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Sent At</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {notifications.map((notification) => (
                    <TableRow
                      key={notification.id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>{notification.title}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                          {notification.message}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getTypeIcon(notification.type)}
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {notification.type}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{formatDate(notification.sentAt)}</TableCell>
                      <TableCell>
                        <Chip
                          label={notification.status}
                          color={notification.status === 'sent' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(notification)}
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

      {/* Send Notification Dialog */}
      <Dialog open={openSendDialog} onClose={handleCloseSendDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Send New Notification</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Title"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              label="Message"
              fullWidth
              multiline
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Notification Type</InputLabel>
              <Select
                value={formData.type}
                label="Notification Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Notification['type'] })}
              >
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="alert">Alert</MenuItem>
                <MenuItem value="reminder">Reminder</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Target Audience</InputLabel>
              <Select
                value={formData.targetAudience}
                label="Target Audience"
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as Notification['targetAudience'] })}
              >
                <MenuItem value="all">All Users</MenuItem>
                <MenuItem value="group">Specific Group</MenuItem>
              </Select>
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Schedule Time (Optional)"
                value={formData.sentAt}
                onChange={(newValue: Date | null) => setFormData({ ...formData, sentAt: newValue || new Date() })}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSendDialog}>Cancel</Button>
          <Button onClick={handlePreview} variant="outlined">
            Preview
          </Button>
          <Button onClick={handleSend} variant="contained" startIcon={<SendIcon />}>
            {formData.sentAt && formData.sentAt > new Date() ? 'Schedule' : 'Send Now'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={openPreviewDialog} onClose={() => setOpenPreviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Notification Preview</DialogTitle>
        <DialogContent>
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {getTypeIcon(formData.type || 'info')}
                <Typography variant="h6">{formData.title}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {formData.message}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Target: {formData.targetAudience === 'all' ? 'All Users' : 'Specific Group'}
                </Typography>
                {formData.sentAt && formData.sentAt > new Date() && (
                  <Typography variant="body2" color="text.secondary">
                    Scheduled for: {formatDate(formData.sentAt)}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreviewDialog(false)}>Back to Edit</Button>
          <Button onClick={handleSend} variant="contained" startIcon={<SendIcon />}>
            {formData.sentAt && formData.sentAt > new Date() ? 'Schedule' : 'Send Now'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={openSettingsDialog} onClose={() => setOpenSettingsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Notification Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={pushEnabled}
                  onChange={(e) => setPushEnabled(e.target.checked)}
                />
              }
              label="Enable Push Notifications"
            />
            {pushEnabled && (
              <>
                <TextField
                  label="API Key"
                  fullWidth
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  type="password"
                />
                <Button
                  variant="outlined"
                  onClick={() => {/* Implement test push */}}
                >
                  Test Push Notification
                </Button>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSettingsDialog(false)}>Cancel</Button>
          <Button onClick={() => setOpenSettingsDialog(false)} variant="contained">
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Notifications; 