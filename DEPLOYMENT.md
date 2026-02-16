# GCP VM Deployment Guide

This guide will help you deploy the AP Dashboard frontend application to a Google Cloud Platform (GCP) Virtual Machine.

## Prerequisites

- A GCP account
- Basic knowledge of Linux command line
- Your backend API URL

## Step 1: Create a GCP VM Instance

1. Go to [GCP Console](https://console.cloud.google.com/)
2. Navigate to **Compute Engine** > **VM Instances**
3. Click **Create Instance**
4. Configure your VM:
   - **Name**: `ap-dashboard-vm` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Machine type**: `e2-micro` or `e2-small` (for small apps)
   - **Boot disk**:
     - OS: Ubuntu 22.04 LTS
     - Size: 10-20 GB
   - **Firewall**:
     - ✅ Allow HTTP traffic
     - ✅ Allow HTTPS traffic (if you plan to use SSL)
5. Click **Create**

## Step 2: Connect to Your VM

### Option A: Using GCP Console (Browser SSH)
1. Click **SSH** button next to your VM instance in the GCP Console

### Option B: Using gcloud CLI
```bash
gcloud compute ssh ap-dashboard-vm --zone=your-zone
```

### Option C: Using standard SSH
```bash
ssh username@EXTERNAL_IP
```

## Step 3: Install Git on VM

```bash
sudo apt-get update
sudo apt-get install -y git
```

## Step 4: Clone or Upload Your Project

### Option A: Clone from Git Repository
```bash
cd ~
git clone https://github.com/your-username/ap-dashboard.git
cd ap-dashboard
```

### Option B: Upload Files Using SCP
From your local machine:
```bash
scp -r c:\Users\Mohammed.Shamal\Desktop\ap-dashboard username@EXTERNAL_IP:~/
```

Then on the VM:
```bash
cd ~/ap-dashboard
```

## Step 5: Configure Environment Variables

1. Update the production environment file:
```bash
nano .env.production
```

2. Set your production API URL:
```env
VITE_API_BASE_URL=https://your-production-api.com/api/v1
```

3. Save and exit (Ctrl+X, then Y, then Enter)

## Step 6: Deploy the Application

Run the deployment script:
```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

The script will:
- Install Node.js (if not present)
- Install Nginx (if not present)
- Install npm dependencies
- Build your application
- Configure Nginx
- Start the web server

## Step 7: Access Your Application

Your application will be available at:
```
http://EXTERNAL_IP
```

To find your external IP:
```bash
curl ifconfig.me
```

Or check the GCP Console under VM instances.

## Step 8: (Optional) Configure Custom Domain

### Update Nginx Configuration

1. Edit the nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/ap-dashboard
```

2. Change `server_name` from `_` to your domain:
```nginx
server_name yourdomain.com www.yourdomain.com;
```

3. Reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Configure DNS

In your domain registrar, add an A record:
```
Type: A
Name: @
Value: YOUR_VM_EXTERNAL_IP
TTL: 3600
```

## Step 9: (Optional) Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
```

## Updating Your Application

To deploy updates:

1. Pull latest changes (if using Git):
```bash
cd ~/ap-dashboard
git pull
```

2. Run the deployment script again:
```bash
sudo ./deploy.sh
```

## Useful Commands

### Check Nginx Status
```bash
sudo systemctl status nginx
```

### View Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Restart Nginx
```bash
sudo systemctl restart nginx
```

### Test Nginx Configuration
```bash
sudo nginx -t
```

### Check Application Files
```bash
ls -la /var/www/ap-dashboard/dist
```

## Troubleshooting

### Application Not Loading

1. Check if Nginx is running:
```bash
sudo systemctl status nginx
```

2. Check Nginx error logs:
```bash
sudo tail -50 /var/log/nginx/error.log
```

3. Verify files exist:
```bash
ls -la /var/www/ap-dashboard/dist
```

### API Connection Issues

1. Check your `.env.production` file has the correct API URL
2. Rebuild the application:
```bash
cd ~/ap-dashboard
npm run build
sudo cp -r dist/* /var/www/ap-dashboard/dist/
```

### Firewall Issues

1. Check GCP firewall rules in the console
2. Ensure HTTP/HTTPS traffic is allowed
3. Check UFW status on VM:
```bash
sudo ufw status
sudo ufw allow 'Nginx Full'
```

### Build Fails

1. Check Node.js version:
```bash
node --version  # Should be 18+
```

2. Clear npm cache and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Security Best Practices

1. **Keep System Updated**
```bash
sudo apt-get update && sudo apt-get upgrade -y
```

2. **Configure Firewall**
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
```

3. **Use HTTPS** (SSL certificate) - see Step 9 above

4. **Regular Backups**
```bash
# Backup configuration
sudo tar -czf nginx-backup.tar.gz /etc/nginx/
```

5. **Monitor Logs**
```bash
sudo tail -f /var/log/nginx/access.log
```

## Performance Optimization

### Enable Nginx Caching (Optional)

Edit `/etc/nginx/sites-available/ap-dashboard` and add:
```nginx
# Add at the top of the file
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;
```

### Adjust VM Resources

If your application is slow:
1. Go to GCP Console
2. Stop the VM
3. Edit machine type to a larger size
4. Restart the VM

## Cost Optimization

- Use **e2-micro** for development/small traffic
- Use **e2-small** or **e2-medium** for production
- Set up billing alerts in GCP Console
- Stop/delete VM when not in use (dev environments)

## Support

For issues specific to:
- **GCP**: Check [GCP Documentation](https://cloud.google.com/compute/docs)
- **Nginx**: Check [Nginx Documentation](https://nginx.org/en/docs/)
- **Application**: Check your application logs and backend API status

---

**Deployment Date**: $(date)
**VM Location**: GCP Compute Engine
**Web Server**: Nginx
**Node.js Version**: 20.x
