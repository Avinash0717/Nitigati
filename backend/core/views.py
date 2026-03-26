from django.http import FileResponse, Http404
import os
from django.conf import settings

def serve_file(request, prefix, filepath):
	base_dir = settings.FILE_SERVE_ROOTS.get(prefix)

	if not base_dir:
		raise Http404("Invalid path")

	full_path = os.path.normpath(os.path.join(base_dir, prefix, filepath))

	# 🔒 Security check (VERY important)
	if not full_path.startswith(base_dir):
		raise Http404("Invalid file path")

	if not os.path.exists(full_path):
		raise Http404("File not found")

	return FileResponse(open(full_path, "rb"))