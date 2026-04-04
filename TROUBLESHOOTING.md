# 🔧 Troubleshooting & Common Issues

## ✅ Pre-Startup Checklist

Before running the app, verify:

- [ ] Python 3.8+ installed (`python --version`)
- [ ] Node.js 16+ installed (`node --version`)
- [ ] Git installed (for version control)
- [ ] ~3GB free disk space (for dependencies)
- [ ] Ports 5000 and 5173 are free (not in use)

---

## 🚀 Startup Issues

### Issue: "Module not found" errors

**Solution:**
```bash
# Reinstall Python dependencies
cd Drishti-AI
.\venv\Scripts\python.exe -m pip install --upgrade pip
pip install -r requirements.txt --force-reinstall

# Reinstall Node dependencies
cd client
npm install --force
cd ..
```

### Issue: Port 5000 already in use

**Symptom**: Flask says "Address already in use"

**Solution:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace 1234 with actual PID)
taskkill /PID 1234 /F

# Or change Flask port in app.py (last line)
# app.run(debug=True, host='0.0.0.0', port=5001)
```

### Issue: Port 5173 already in use

**Symptom**: Vite says "Port 5173 is in use"

**Solution:**
```powershell
# Find process
netstat -ano | findstr :5173

# Kill it
taskkill /PID 1234 /F

# Or Vite will auto-use next available port
```

### Issue: venv not found

**Symptom**: "No such file or directory: venv"

**Solution:**
```bash
cd Drishti-AI
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

---

## 🔗 Backend Issues

### Issue: "Cannot load model" or "trained_model.pth not found"

**Symptom**: Flask starts but shows "model_loaded: false"

**Solution:**
1. Check `trained_model.pth` exists in Drishti-AI folder
   ```bash
   ls -la trained_model.pth  # Should exist
   ```
2. If missing, the model is optional - backend still works!
3. To use a real model, place `.pth` file in root directory

### Issue: "ModuleNotFoundError: No module named 'torch'"

**Symptom**: Flask crashes with PyTorch error

**Solution:**
```bash
# Install PyTorch from venv
cd Drishti-AI
.\venv\Scripts\Activate.ps1
pip install torch torchvision numpy --force-reinstall
```

### Issue: "Import error" in app.py

**Symptom**: Flask shows import errors

**Solution:**
1. Check you're using the venv Python:
   ```bash
   which python  # Should show venv path
   ```
2. Run with explicit Python path:
   ```bash
   C:\Users\HP\Desktop\Drishti_ai\Drishti-AI\venv\Scripts\python.exe app.py
   ```

### Issue: Flask crashes when receiving image

**Symptom**: `POST /api/predict` returns 500 error

**Solutions:**
1. Check image size: Should be < 10MB
2. Check image format: Accepts base64 JPG/PNG
3. Check Flask logs for specific error
4. Try with a simple test image first

---

## 🎨 Frontend Issues

### Issue: "Cannot find module 'api.ts'"

**Symptom**: Build fails with import error

**Solution:**
```bash
cd client
npm install
npm run build
```

### Issue: "Backend: Not connected" message always shows

**Symptom**: Blue health message shows connection error

**Solutions:**
1. Check Flask is running:
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return JSON response

2. Check Vite proxy in `client/vite.config.ts`:
   ```typescript
   server: {
     proxy: {
       '/api': {
         target: 'http://localhost:5000',  // Must match Flask port
         changeOrigin: true,
       }
     }
   }
   ```

3. Ensure backend started before frontend

### Issue: Images not uploading

**Symptom**: Click upload, nothing happens or error appears

**Solutions:**
1. Check browser console (F12 → Console tab)
2. Verify Flask is running (`/api/health` should work)
3. Check image size (< 10MB)
4. Try different image format

### Issue: Voice commands not working

**Symptom**: Clicking 🤖 button does nothing

**Solutions:**
1. Chrome/Edge/Safari only (not Firefox)
2. Check microphone permissions in browser
3. Must be on localhost or HTTPS
4. Check browser console for errors

### Issue: Styling looks broken (no Tailwind CSS)

**Symptom**: UI looks plain, no colors

**Solution:**
```bash
cd client
npm install tailwindcss postcss autoprefixer
npm run dev
```

---

## 🔄 Synchronization Issues

### Issue: Changes not reflecting when I edit code

**Frontend:**
```bash
# Vite should hot-reload automatically
# If not, stop and restart:
npm run dev
```

**Backend:**
```bash
# Flask must be restarted for changes
# Stop: Ctrl+C
# Restart: python app.py
```

### Issue: Frontend works but backend changes not applied

**Solution:**
1. Stop Flask server (Ctrl+C in terminal)
2. Make changes to app.py
3. Restart Flask:
   ```bash
   python app.py
   ```

---

## 📊 Testing Issues

### Issue: Can't test /api/predict endpoint manually

**Solution:**
Use PowerShell to test API:

```powershell
# First, create a base64 image
$img = [Convert]::ToBase64String((Get-Content -Path "path\to\image.jpg" -Encoding Byte))

# Send to API
$body = @{ image = $img } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/predict" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

Or use curl from Git Bash:
```bash
curl -X POST http://localhost:5000/api/health
```

---

## 🐛 Advanced Debugging

### Enable verbose logging

**Flask:**
```python
# Add to app.py
import logging
logging.basicConfig(level=logging.DEBUG)
app.logger.setLevel(logging.DEBUG)
```

**Vite:**
```bash
# Run with verbose output
npm run dev -- --debug
```

### Check all processes

```powershell
# See all Python processes
Get-Process python

# See all Node processes
Get-Process node
```

### Clear caches

```bash
# Frontend
cd client
rm -r node_modules .cache dist
npm install

# Backend
cd ..
pip cache purge
pip install -r requirements.txt --force-reinstall --no-cache-dir
```

---

## 📱 Browser Console Errors

### "CORS error"

**Symptom**: Browser console shows CORS policy error

**Solution:**
1. Check Flask-CORS is enabled in app.py:
   ```python
   CORS(app)
   ```
2. Ensure Flask is running before frontend
3. Check proxy in vite.config.ts points to right port

### "Cannot read property 'srcObject'"

**Symptom**: Camera won't initialize

**Solution:**
1. Give browser camera permissions
2. Must be localhost or HTTPS
3. Check browser privacy settings

### "API returned 500 error"

**Symptom**: API call fails with server error

**Solution:**
1. Check Flask logs for error message
2. Verify request format is correct
3. Check image data is valid base64

---

## 💾 Database/File Issues

### Issue: trained_model.pth too large to commit

**Solution:**
Add to `.gitignore`:
```
trained_model.pth
*.pth
```

Then use Git LFS or cloud storage for large files.

---

## 🌐 Deployment Issues

### Issue: Works locally but not on server

**Checklist:**
- [ ] `npm run build` runs successfully
- [ ] `client/dist/` folder exists and has files
- [ ] Flask points to correct `client/dist` folder
- [ ] Environment variables set on server
- [ ] Ports 5000/5173 open on server
- [ ] Python 3.8+ installed on server
- [ ] Node.js 16+ installed on server

### Testing production locally

```bash
# Build frontend
cd client
npm run build
cd ..

# Ensure Flask serves from dist
# Check app.py: static_folder='client/dist'

# Run Flask server
python app.py

# Visit http://localhost:5000
```

---

## 🆘 If All Else Fails

1. **Delete everything and start fresh**:
   ```bash
   rm -r venv client/node_modules client/dist
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   cd client && npm install && cd ..
   ```

2. **Check Python version**:
   ```bash
   python --version  # Should be 3.8+
   ```

3. **Check Node version**:
   ```bash
   node --version  # Should be 16+
   npm --version   # Should be 7+
   ```

4. **Recreate from scratch**:
   ```bash
   # Backup your work first!
   git checkout -- .
   rm -r venv node_modules
   # Start over with setup
   ```

5. **Check official docs**:
   - [Flask Docs](https://flask.palletsprojects.com/)
   - [React Docs](https://react.dev/)
   - [Vite Docs](https://vitejs.dev/)

---

## 📞 Getting Help

If stuck:
1. Check error message carefully (ctrl+C to show full error)
2. Search the documentation files (README.md, INTEGRATION_GUIDE.md)
3. Check browser console (F12)
4. Check Flask terminal output
5. Enable debugging in both Flask and Vite
6. Recreate the issue in isolation

---

## ✅ Verification Steps

After fixing any issue:

```bash
# 1. Test Flask backend
curl http://localhost:5000/api/health

# 2. Test Frontend can reach API
# Open browser console and run:
fetch('/api/health').then(r => r.json()).then(d => console.log(d))

# 3. Test ML model
# Upload an image from the UI and check browser console

# 4. Check no errors in:
# - Flask terminal output
# - Browser console (F12 → Console tab)
# - Network tab (F12 → Network tab)
```

---

## 🎯 Success Indicators

Your setup is working correctly when:

✅ Flask shows: "Running on http://0.0.0.0:5000"
✅ Vite shows: "Local: http://localhost:5173"
✅ Browser shows "✅ Backend: healthy"
✅ Image upload returns AI prediction
✅ Voice commands are transcribed
✅ No errors in browser console

---

**Happy debugging!** 🚀

If you encounter issues not listed here, please check:
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- [QUICK_START.md](./QUICK_START.md)
- Flask error messages in terminal
- Browser console errors (F12)
