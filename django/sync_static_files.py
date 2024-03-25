import sys
import time
import shutil
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class FileChangeHandler(FileSystemEventHandler):
	def __init__(self, source_dir, target_dir):
		self.source_dir = './static'
		self.target_dir = './staticfiles'

	def on_modified(self, event):
		if not event.is_directory:
			source_path = event.src_path
			target_path = source_path.replace(self.source_dir, self.target_dir)
			shutil.copy2(source_path, target_path)
			print(f"Copied {source_path} to {target_path}")

if __name__ == "__main__":
	source_dir = './static'
	target_dir = './staticfiles'
	event_handler = FileChangeHandler(source_dir, target_dir)
	observer = Observer()
	observer.schedule(event_handler, source_dir, recursive=True)
	observer.start()
	try:
		while True:
			time.sleep(1)
	except KeyboardInterrupt:
		observer.stop()
	observer.join()

# DELETE BEFORE PUSH TO GITHUB