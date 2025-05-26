import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export default function AddNodePopover() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button>Add Node</Button>
            </PopoverTrigger>
            <PopoverContent>
                <div>
                    <Button>
                        Add to Database
                    </Button>
                    <Button>
                        Add to Database & Graph
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}